"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "./_supabase-available";
import { createCustomOrderIntent } from "./payments";

export type CustomOrderIntentResult =
  | {
      ok: true;
      demo: false;
      clientSecret: string;
      amountCents: number;
      mode: "deposit" | "full";
      outstandingCents: number;
    }
  | {
      ok: true;
      demo: true;
      amountCents: number;
      mode: "deposit" | "full";
      outstandingCents: number;
    }
  | { ok: false; error: string };

/**
 * Create (or open) a Stripe PaymentIntent for a custom-order payment.
 *
 * Mirrors `bookings-pay.ts` but reads the user-scoped `custom_orders` row
 * and writes the pending `payments` record under `custom_order_id`. RLS
 * enforces ownership at read-time; we double-check by `customer_id` so the
 * surface is symmetric with the booking flow.
 *
 * Modes:
 *   - "deposit" → 50% of the quote (rounded to whole cents).
 *   - "full"    → the entire outstanding balance (quote − totalPaid).
 *
 * Demo mode (no Supabase OR no Stripe) returns `demo: true` with the
 * indicative amount so the UI can render a graceful preview.
 */
export async function createCustomOrderPaymentIntent(
  reference: string,
  mode: "deposit" | "full",
): Promise<CustomOrderIntentResult> {
  if (!supabaseAvailable()) {
    // Use a stable demo amount so the flow renders sensibly without DB.
    const demoQuote = 318000;
    const outstanding = demoQuote;
    const amount = mode === "deposit" ? Math.round(demoQuote * 0.5) : outstanding;
    return { ok: true, demo: true, amountCents: amount, mode, outstandingCents: outstanding };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to continue payment." };

  type Sel = {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: {
              id: string;
              status: string;
              quote_total_cents: number | null;
              deposit_paid_cents: number | null;
              total_paid_cents: number | null;
              contact_email: string | null;
              payment_setting: string | null;
            } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };

  const { data: order, error } = await (
    supabase.from("custom_orders") as unknown as Sel
  )
    .select(
      "id, status, quote_total_cents, deposit_paid_cents, total_paid_cents, contact_email, payment_setting",
    )
    .eq("reference", reference)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[custom-orders-pay] read failed", error);
    return { ok: false, error: "Couldn't load this order." };
  }
  if (!order) return { ok: false, error: "Order not found." };

  if (["cancelled", "completed"].includes(order.status)) {
    return { ok: false, error: "This order is no longer accepting payments." };
  }

  const quote = order.quote_total_cents ?? 0;
  if (quote <= 0) {
    return { ok: false, error: "We haven't sent a quote yet — payment opens once the quote arrives." };
  }
  const totalPaid = order.total_paid_cents ?? 0;
  const outstanding = quote - totalPaid;
  if (outstanding <= 0) {
    return { ok: false, error: "This order is already paid in full." };
  }

  // For deposit mode, charge 50% of the quote less anything already paid.
  // If a deposit was already paid, the customer's only remaining option is
  // the full balance — collapse to "full".
  let amountCents: number;
  let actualMode: "deposit" | "full" = mode;
  if (mode === "deposit") {
    const targetDeposit = Math.round(quote * 0.5);
    const remainingDeposit = Math.max(0, targetDeposit - (order.deposit_paid_cents ?? 0));
    if (remainingDeposit <= 0) {
      // Deposit already covered — fall through to full.
      amountCents = outstanding;
      actualMode = "full";
    } else {
      amountCents = remainingDeposit;
    }
  } else {
    amountCents = outstanding;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      ok: true,
      demo: true,
      amountCents,
      mode: actualMode,
      outstandingCents: outstanding,
    };
  }

  let intentId: string;
  let clientSecret: string;
  try {
    const intent = await createCustomOrderIntent({
      amountCents,
      customOrderReference: reference,
      customerEmail: order.contact_email ?? user.email ?? "",
      mode: actualMode,
    });
    intentId = intent.id;
    clientSecret = intent.client_secret ?? "";
    if (!clientSecret) {
      return { ok: false, error: "Stripe did not return a client secret." };
    }
  } catch (e) {
    console.error("[custom-orders-pay] stripe failed", e);
    return { ok: false, error: "Couldn't open the payment. Try again." };
  }

  // Insert pending `payments` row via the admin client (clients can't
  // insert). Webhook reconciles regardless if this fails.
  try {
    const admin = createSupabaseAdminClient();
    type PayInsert = {
      insert: (
        row: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    };
    await (admin.from("payments") as unknown as PayInsert).insert({
      custom_order_id: order.id,
      kind: actualMode === "deposit" ? "deposit" : "final",
      status: "pending",
      amount_cents: amountCents,
      currency: "NZD",
      stripe_payment_intent: intentId,
    });
  } catch (e) {
    console.warn("[custom-orders-pay] payments insert failed (non-fatal)", e);
  }

  return {
    ok: true,
    demo: false,
    clientSecret,
    amountCents,
    mode: actualMode,
    outstandingCents: outstanding,
  };
}
