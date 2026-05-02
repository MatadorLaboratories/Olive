import "server-only";
import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTemplate } from "./email-templates";
import { generateAndStoreReceipt } from "./receipts";
import { getStripe } from "./payments";
import { site } from "@/config/site";
import { supabaseAvailable } from "./_supabase-available";

/**
 * Custom-order payment fulfillment.
 *
 * Single source of truth for "what happens when a custom-order payment
 * lands". Called from two places, both of which run the same code:
 *
 *   1. The Stripe webhook — the canonical async path. Stripe POSTs
 *      `payment_intent.succeeded` to `/api/stripe/webhook`, which calls
 *      `applyCustomOrderPayment(intent, kind)` directly.
 *
 *   2. The customer's confirmation page — the synchronous fallback.
 *      `confirmPayment` redirects with `?payment_intent=...` and the
 *      page calls `ensureCustomOrderPaymentApplied(ref, intentId)`,
 *      which retrieves the intent from Stripe, validates, and delegates.
 *
 * Idempotency key: `payments.status === "succeeded"` for the same
 * `stripe_payment_intent`. Whichever path runs first wins; the second is
 * a no-op. This is what keeps webhook replays + dual-path concurrency
 * from double-incrementing paid totals.
 *
 * The fallback exists because:
 *  - In dev without `stripe listen` the webhook never fires.
 *  - In prod the webhook can land seconds after the redirect — the
 *    customer would otherwise see a "still owing" view immediately
 *    after paying.
 */

type CustomOrderPaymentKind = "custom_order_deposit" | "custom_order_full";

export type ApplyResult =
  | { ok: true; applied: boolean; reference: string }
  | { ok: false; error: string };

const STATUS_RANK: Record<string, number> = {
  new_request: 0,
  awaiting_quote: 1,
  quote_sent: 2,
  deposit_paid: 3,
  in_production: 4,
  ready: 5,
  completed: 6,
  cancelled: -1,
};

export async function applyCustomOrderPayment(
  intent: Stripe.PaymentIntent,
  kind: CustomOrderPaymentKind,
): Promise<ApplyResult> {
  if (!supabaseAvailable()) {
    return { ok: false, error: "Database unavailable." };
  }

  const reference = intent.metadata?.custom_order_reference;
  if (!reference) {
    return { ok: false, error: "PaymentIntent missing custom_order_reference metadata." };
  }

  const admin = createSupabaseAdminClient();

  // ---- idempotency guard ----
  type PaySel = {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{
          data: { id: string; status: string } | null;
        }>;
      };
    };
  };
  const { data: existingPayment } = await (
    admin.from("payments") as unknown as PaySel
  )
    .select("id, status")
    .eq("stripe_payment_intent", intent.id)
    .maybeSingle();

  if (existingPayment?.status === "succeeded") {
    return { ok: true, applied: false, reference };
  }

  // The Stripe charge's hosted-receipt URL is nice-to-have for the audit
  // trail; pull it off the expanded charge if present, otherwise leave null.
  const chargeReceiptUrl = stripeReceiptUrlFrom(intent);

  // ---- 1. Mark or insert the payments row ----
  if (existingPayment) {
    type PayUpd = {
      update: (row: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    };
    await (admin.from("payments") as unknown as PayUpd)
      .update({
        status: "succeeded",
        paid_at: new Date().toISOString(),
        receipt_url: chargeReceiptUrl,
      })
      .eq("stripe_payment_intent", intent.id);
  } else {
    // The pending row would normally have been inserted by
    // `createCustomOrderPaymentIntent`, but if that side of the flow
    // failed silently we still want a payments record on file. Defensive
    // — keeps the audit trail honest.
    type PayInsert = {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
    await (admin.from("payments") as unknown as PayInsert).insert({
      kind: kind === "custom_order_deposit" ? "deposit" : "final",
      status: "succeeded",
      amount_cents: intent.amount,
      currency: "NZD",
      stripe_payment_intent: intent.id,
      paid_at: new Date().toISOString(),
      receipt_url: chargeReceiptUrl,
    });
  }

  // ---- 2. Read the order ----
  type OrderSel = {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{
          data: {
            id: string;
            status: string;
            quote_total_cents: number | null;
            deposit_paid_cents: number | null;
            total_paid_cents: number | null;
            contact_name: string | null;
            contact_email: string | null;
            fabric: string | null;
            edge_style: string | null;
            colour: string | null;
            quantity: number | null;
            quantity_tier: string | null;
          } | null;
        }>;
      };
    };
  };
  const { data: order } = await (
    admin.from("custom_orders") as unknown as OrderSel
  )
    .select(
      "id, status, quote_total_cents, deposit_paid_cents, total_paid_cents, contact_name, contact_email, fabric, edge_style, colour, quantity, quantity_tier",
    )
    .eq("reference", reference)
    .maybeSingle();

  if (!order) {
    return { ok: false, error: `Order ${reference} not found.` };
  }

  // ---- 3. Compute and apply state changes ----
  const isDeposit = kind === "custom_order_deposit";
  const newDepositCents =
    (order.deposit_paid_cents ?? 0) + (isDeposit ? intent.amount : 0);
  const newTotalPaidCents = (order.total_paid_cents ?? 0) + intent.amount;
  const quote = order.quote_total_cents ?? 0;
  const fullyPaid = quote > 0 && newTotalPaidCents >= quote;

  // Don't downgrade an order the studio already moved further along the
  // pipeline. Cancelled orders stay cancelled.
  const targetStatus = fullyPaid ? "in_production" : "deposit_paid";
  const currentRank = STATUS_RANK[order.status] ?? 0;
  const targetRank = STATUS_RANK[targetStatus] ?? 0;
  const nextStatus =
    order.status === "cancelled"
      ? "cancelled"
      : currentRank > targetRank
        ? order.status
        : targetStatus;

  // Important: link the payments row to the order if it was inserted by
  // the fallback above (which doesn't have access to order.id).
  if (!existingPayment) {
    type PayUpd2 = {
      update: (row: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    };
    await (admin.from("payments") as unknown as PayUpd2)
      .update({ custom_order_id: order.id })
      .eq("stripe_payment_intent", intent.id);
  }

  type OrderUpd = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  await (admin.from("custom_orders") as unknown as OrderUpd)
    .update({
      status: nextStatus,
      deposit_paid_cents: newDepositCents,
      total_paid_cents: newTotalPaidCents,
      paid_at: fullyPaid ? new Date().toISOString() : null,
    })
    .eq("id", order.id);

  // ---- 4. Email template (best-effort) ----
  const recipient = intent.receipt_email ?? order.contact_email;
  if (recipient) {
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(n);
    const firstName = (order.contact_name ?? "").split(" ")[0] ?? "there";
    const outstanding = Math.max(0, quote - newTotalPaidCents);

    try {
      await sendTemplate({
        to: recipient,
        templateKey: fullyPaid
          ? "custom_order.fully_paid"
          : "custom_order.deposit_received",
        vars: {
          reference,
          firstName,
          amount: fmt(intent.amount / 100),
          quoteTotal: fmt(quote / 100),
          outstandingAmount: fmt(outstanding / 100),
          portalUrl: `${site.url}/account/custom-orders/${reference}`,
        },
      });
    } catch (e) {
      console.warn("[custom-orders-fulfill] email failed (non-fatal)", e);
    }
  }

  // ---- 5. Branded PDF receipt (best-effort, idempotent on its own) ----
  const buildLine = [order.fabric, order.edge_style, order.colour]
    .filter(Boolean)
    .map(titleCase)
    .join(" · ");
  const qtyLabel = order.quantity
    ? `${order.quantity} pcs`
    : (order.quantity_tier ?? "");

  await generateAndStoreReceipt({
    paymentIntentId: intent.id,
    stripeChargeId: null,
    stripeReceiptUrl: chargeReceiptUrl,
    amountCents: intent.amount,
    paidAtIso: new Date().toISOString(),
    anchor: { kind: "custom_order", customOrderId: order.id },
    orderReference: reference,
    orderType: "custom_order",
    paymentLabel: isDeposit ? "Deposit" : "Pay in full",
    lineItems: [
      {
        label: buildLine ? `Custom napkins — ${buildLine}` : "Custom napkin order",
        sublabel: qtyLabel,
        amountCents: quote,
      },
    ],
    customer: {
      name: order.contact_name ?? recipient ?? "Customer",
      email: order.contact_email ?? recipient ?? null,
    },
    orderTotalCents: quote,
    previouslyPaidCents: order.total_paid_cents ?? 0,
  });

  return { ok: true, applied: true, reference };
}

/**
 * Server-callable wrapper for the customer's confirmation page.
 *
 * Trust boundary: Stripe is the source of truth. We retrieve the
 * PaymentIntent from Stripe by id (so a tampered URL can't trick us),
 * verify status === "succeeded", verify the metadata reference matches
 * the URL reference, then delegate to `applyCustomOrderPayment`.
 */
export async function ensureCustomOrderPaymentApplied(
  reference: string,
  paymentIntentId: string,
): Promise<ApplyResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { ok: false, error: "Stripe not configured." };
  }

  const stripe = getStripe();
  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
  } catch (e) {
    console.error("[custom-orders-fulfill] retrieve failed", e);
    return { ok: false, error: "Couldn't verify payment with Stripe." };
  }

  if (intent.status !== "succeeded") {
    return { ok: false, error: `Payment is ${intent.status}.` };
  }

  const intentReference = intent.metadata?.custom_order_reference;
  if (intentReference !== reference) {
    return { ok: false, error: "Payment reference mismatch." };
  }

  const kind = intent.metadata?.kind;
  if (kind !== "custom_order_deposit" && kind !== "custom_order_full") {
    return { ok: false, error: "Not a custom-order payment." };
  }

  return applyCustomOrderPayment(intent, kind);
}

// ---------- helpers ----------

function stripeReceiptUrlFrom(intent: Stripe.PaymentIntent): string | null {
  // Stripe's modern shape is `latest_charge` (id or expanded). Older
  // accounts also see `charges.data[]`. We accept either, fall back to null.
  const expanded = intent as Stripe.PaymentIntent & {
    charges?: { data?: Array<{ receipt_url?: string | null }> };
  };
  if (expanded.charges?.data?.[0]?.receipt_url) {
    return expanded.charges.data[0].receipt_url;
  }
  const lc = (intent as { latest_charge?: unknown }).latest_charge;
  if (lc && typeof lc === "object" && "receipt_url" in lc) {
    return ((lc as { receipt_url?: string | null }).receipt_url) ?? null;
  }
  return null;
}

function titleCase(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .split(/[\s_-]+/)
    .map((w) => (w ? w[0]?.toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}
