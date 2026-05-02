"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "../_supabase-available";
import { sendTemplate } from "../email-templates";
import { site } from "@/config/site";
import type { CustomOrderStatus } from "@/types/domain";

const ALL_STATUSES: CustomOrderStatus[] = [
  "new_request",
  "awaiting_quote",
  "quote_sent",
  "deposit_paid",
  "in_production",
  "ready",
  "completed",
  "cancelled",
];

/**
 * Save / update a custom order's quote total + status. When status flips
 * to `quote_sent`, fire the `custom_order.quote_sent` template so the
 * customer gets a clean email pointing them to the portal pay page.
 */
export async function saveCustomOrderQuote(args: {
  id: string;
  reference: string;
  quoteTotalCents: number | null;
  status: CustomOrderStatus;
  internalNotes?: string | null;
}) {
  if (!ALL_STATUSES.includes(args.status))
    return { ok: false as const, error: "Unknown status." };

  if (!supabaseAvailable()) return { ok: true as const };

  const admin = createSupabaseAdminClient();

  type Sel = {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{
          data: {
            status: string;
            contact_email: string | null;
            contact_name: string | null;
            quote_total_cents: number | null;
          } | null;
        }>;
      };
    };
  };
  const { data: prior } = await (admin.from("custom_orders") as unknown as Sel)
    .select("status, contact_email, contact_name, quote_total_cents")
    .eq("id", args.id)
    .maybeSingle();

  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { error } = await (admin.from("custom_orders") as unknown as Update)
    .update({
      quote_total_cents: args.quoteTotalCents,
      status: args.status,
      internal_notes: args.internalNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.id);

  if (error) return { ok: false as const, error: error.message };

  // If we transitioned into `quote_sent` (or set the quote on a new send),
  // email the customer their quote with a portal link.
  const becameQuoted =
    args.status === "quote_sent" && prior?.status !== "quote_sent";
  if (becameQuoted && prior?.contact_email && args.quoteTotalCents) {
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(n);
    const firstName = (prior.contact_name ?? "").split(" ")[0] ?? "there";
    try {
      await sendTemplate({
        to: prior.contact_email,
        templateKey: "custom_order.quote_sent",
        vars: {
          reference: args.reference,
          firstName,
          quoteTotal: fmt(args.quoteTotalCents / 100),
          portalUrl: `${site.url}/account/custom-orders/${args.reference}`,
        },
      });
    } catch (e) {
      console.warn("[custom-order-actions] quote email failed", e);
    }
  }

  revalidatePath("/admin/wholesale");
  revalidatePath(`/admin/wholesale/${args.reference}`);
  return { ok: true as const };
}
