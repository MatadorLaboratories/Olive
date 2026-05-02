"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendTransactional } from "@/services/email";
import { supabaseAvailable } from "./_supabase-available";
import { site } from "@/config/site";
import { getCmsBlock } from "@/services/cms";
import {
  computeQuoteFromBuilder,
  type ComputedQuote,
} from "@/services/custom-order-pricing";

/**
 * Until the generated Supabase types arrive (`npm run db:types`), the
 * client's strict `Insert` shapes resolve to `never`. This helper names
 * the cast — search for `untyped` to find every place that needs to
 * tighten up after type generation.
 */
type UntypedInsertable = {
  insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
};
const untyped = <T>(builder: T) => builder as unknown as UntypedInsertable;

const enquirySchema = z.object({
  name: z.string().min(2, "Tell us your name"),
  email: z.string().email("Looks like that's not an email"),
  phone: z.string().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  message: z.string().min(10, "A few more words helps us write back well"),
  source: z.string().optional().default("website"),
});

const customOrderSchema = z.object({
  customerType: z.string().min(1),
  businessName: z.string().optional().nullable(),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional().nullable(),
  fabric: z.string().min(1),
  edgeStyle: z.string().min(1),
  colour: z.string().min(1),
  quantityTier: z.string().min(1),
  quantity: z.coerce.number().int().min(1).optional().nullable(),
  preferredDeadline: z.string().optional().nullable(),
  brandNotes: z.string().optional().nullable(),
  paymentSetting: z.enum(["quote_only", "deposit", "full_payment"]).optional().default("quote_only"),
  logoUrl: z.string().optional().nullable(),
  inspirationUrls: z.array(z.string()).optional().default([]),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type CustomOrderInput = z.infer<typeof customOrderSchema>;

export type ServerActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Submit a generic contact / enquiry form.
 *
 * - Validates with Zod.
 * - Inserts into `enquiries` if Supabase is connected (RLS allows anon insert).
 * - Sends a notification email to the studio if Resend is connected.
 * - Always returns a structured result; never throws to the caller.
 */
export async function submitEnquiry(input: EnquiryInput): Promise<ServerActionResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { ok: false, error: "Please check the form and try again.", fieldErrors };
  }
  const data = parsed.data;

  if (supabaseAvailable()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await untyped(supabase.from("enquiries")).insert({
        source: data.source,
        name: data.name,
        email: data.email,
        phone: data.phone,
        event_date: data.eventDate,
        message: data.message,
      });
      if (error) {
        console.error("[enquiries.submit] insert failed", error);
        return { ok: false, error: "Couldn't save your message — please try again or email us directly." };
      }
    } catch (e) {
      console.error("[enquiries.submit] supabase error", e);
    }
  }

  // Try to email the studio. Never block on failure — the row is the source of truth.
  if (process.env.RESEND_API_KEY) {
    try {
      await sendTransactional({
        to: site.contactEmail,
        subject: `New enquiry — ${data.name}`,
        html: enquiryEmailHtml(data),
      });
    } catch (e) {
      console.warn("[enquiries.submit] email failed (non-fatal)", e);
    }
  }

  return { ok: true };
}

/**
 * Submit a custom-napkin / hospitality order request.
 *
 * Generates an auto-quote at submission time using the builder selections
 * + CMS rate card so the customer sees a real number on the outcome
 * screen and can pay deposit / in full immediately. The studio admin can
 * still override the total later from `/admin/wholesale/[reference]`.
 *
 * When the auto-quote can't be produced (e.g. specialty edge), the row
 * goes in at `awaiting_quote` so the studio takes over.
 */
export async function submitCustomOrder(
  input: CustomOrderInput,
): Promise<
  ServerActionResult<{
    reference: string;
    loggedIn: boolean;
    quote: ComputedQuote;
  }>
> {
  const parsed = customOrderSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { ok: false, error: "Please complete the missing fields.", fieldErrors };
  }
  const data = parsed.data;

  // Compute the auto-quote up front using the same CMS options the builder
  // saw — single source of truth for tier/fabric/edge maths.
  const options = await getCmsBlock("hospitality.options");
  const quote = computeQuoteFromBuilder(
    {
      fabric: data.fabric,
      edgeStyle: data.edgeStyle,
      quantityTier: data.quantityTier,
      quantity: data.quantity ?? null,
    },
    {
      fabrics: [...options.fabrics],
      edges: [...options.edges],
      colours: [...options.colours],
      quantityTiers: [...options.quantityTiers],
      customerTypes: [...options.customerTypes],
    },
  );

  // Generate a soft reference for the email & receipt page.
  const reference = `OLV-CO-${Math.floor(Math.random() * 9000 + 1000)}`;
  let loggedIn = false;

  // If we produced a numeric quote we mark the order as `quote_sent` (the
  // customer is looking at it on screen). Otherwise we route it through
  // `awaiting_quote` so the studio picks it up.
  const initialStatus = quote.ok ? "quote_sent" : "awaiting_quote";

  if (supabaseAvailable()) {
    try {
      const supabase = await createSupabaseServerClient();
      // If the submitter is logged in, link the row to them so it shows up
      // in their `/account/custom-orders` view under RLS. Anonymous
      // submissions are still allowed by policy and surface only to staff
      // — they get linked on first login via `claimCustomOrders()`.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      loggedIn = !!user;

      const { error } = await untyped(supabase.from("custom_orders")).insert({
        reference,
        status: initialStatus,
        customer_id: user?.id ?? null,
        customer_type: data.customerType,
        business_name: data.businessName,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        fabric: data.fabric,
        edge_style: data.edgeStyle,
        colour: data.colour,
        quantity_tier: data.quantityTier,
        quantity: data.quantity,
        preferred_deadline: data.preferredDeadline,
        brand_notes: data.brandNotes,
        payment_setting: data.paymentSetting,
        logo_url: data.logoUrl,
        inspiration_urls: data.inspirationUrls,
        quote_total_cents: quote.ok ? quote.totalCents : null,
      });
      if (error) {
        console.error("[customOrder.submit] insert failed", error);
        return { ok: false, error: "Couldn't save your request — please try again." };
      }
    } catch (e) {
      console.error("[customOrder.submit] supabase error", e);
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      await sendTransactional({
        to: site.contactEmail,
        subject: `New custom-napkin enquiry — ${reference}`,
        html: customOrderEmailHtml(data, reference, quote),
      });
    } catch (e) {
      console.warn("[customOrder.submit] email failed (non-fatal)", e);
    }
  }

  return { ok: true, data: { reference, loggedIn, quote } };
}

// ---------- email bodies (kept simple — Phase 4 templates them) ----------
function enquiryEmailHtml(d: EnquiryInput): string {
  return `
    <h2 style="font-family:Georgia,serif;color:#2a3520">New enquiry — ${escape(d.name)}</h2>
    <p style="font-family:Inter,sans-serif">Source: ${escape(d.source ?? "website")}</p>
    <ul style="font-family:Inter,sans-serif">
      <li><strong>Email:</strong> ${escape(d.email)}</li>
      <li><strong>Phone:</strong> ${escape(d.phone ?? "—")}</li>
      <li><strong>Event date:</strong> ${escape(d.eventDate ?? "—")}</li>
    </ul>
    <p style="font-family:Inter,sans-serif;white-space:pre-line">${escape(d.message)}</p>
  `;
}

function customOrderEmailHtml(
  d: CustomOrderInput,
  reference: string,
  quote: ComputedQuote,
): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(n / 100);
  return `
    <h2 style="font-family:Georgia,serif;color:#2a3520">${reference} — Custom napkin enquiry</h2>
    <ul style="font-family:Inter,sans-serif">
      <li><strong>Type:</strong> ${escape(d.customerType)}</li>
      <li><strong>Business:</strong> ${escape(d.businessName ?? "—")}</li>
      <li><strong>Contact:</strong> ${escape(d.contactName)} — ${escape(d.contactEmail)}</li>
      <li><strong>Phone:</strong> ${escape(d.contactPhone ?? "—")}</li>
      <li><strong>Fabric / Edge / Colour:</strong> ${escape(d.fabric)} · ${escape(d.edgeStyle)} · ${escape(d.colour)}</li>
      <li><strong>Quantity tier:</strong> ${escape(d.quantityTier)}${d.quantity ? ` (${d.quantity})` : ""}</li>
      <li><strong>Deadline:</strong> ${escape(d.preferredDeadline ?? "—")}</li>
      <li><strong>Payment:</strong> ${escape(d.paymentSetting)}</li>
      ${quote.ok ? `<li><strong>Auto-quote:</strong> ${fmt(quote.totalCents)}${quote.isIndicative ? " (indicative)" : ""}</li>` : `<li><strong>Auto-quote:</strong> — ${escape(quote.unpriceableReason ?? "needs studio")}</li>`}
    </ul>
    ${d.brandNotes ? `<p style="font-family:Inter,sans-serif;white-space:pre-line"><strong>Notes:</strong><br>${escape(d.brandNotes)}</p>` : ""}
  `;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
