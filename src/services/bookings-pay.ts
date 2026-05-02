"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "./_supabase-available";
import { createFinalBalanceIntent } from "./payments";

export type FinalIntentResult =
  | { ok: true; clientSecret: string; outstandingCents: number; demo: false }
  | { ok: true; demo: true; outstandingCents: number }
  | { ok: false; error: string };

/**
 * Create (or re-use) a final-balance PaymentIntent for a booking.
 *
 * Caller must be authenticated and own the booking (RLS enforces; we also
 * re-check with the user-scoped client for clarity).
 *
 * Demo mode (no Supabase OR no Stripe): returns `{ ok: true, demo: true }`
 * with the outstanding amount so the UI can show a graceful "demo" notice.
 */
export async function createFinalBalanceIntentForBooking(
  reference: string,
): Promise<FinalIntentResult> {
  // Demo mode without a live DB — surface a clean state.
  if (!supabaseAvailable()) {
    return { ok: true, demo: true, outstandingCents: 0 };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to pay your balance." };

  // Read the booking through the user's RLS-scoped client first so we get
  // a clean access denial if the user shouldn't see this row.
  type BookingSel = {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        maybeSingle: () => Promise<{
          data: {
            id: string;
            client_id: string | null;
            vendor_id: string | null;
            client_email: string | null;
            total_cents: number;
            deposit_paid_cents: number;
            final_paid_cents: number;
            status: string;
          } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
  const { data: booking, error } = await (
    supabase.from("bookings") as unknown as BookingSel
  )
    .select(
      "id, client_id, vendor_id, client_email, total_cents, deposit_paid_cents, final_paid_cents, status",
    )
    .eq("reference", reference)
    .maybeSingle();

  if (error) {
    console.error("[bookings-pay] read failed", error);
    return { ok: false, error: "Couldn't load this booking." };
  }
  if (!booking) return { ok: false, error: "Booking not found." };

  const outstanding =
    booking.total_cents - booking.deposit_paid_cents - booking.final_paid_cents;
  if (outstanding <= 0) {
    return { ok: false, error: "This booking is already paid in full." };
  }
  if (["cancelled", "archived"].includes(booking.status)) {
    return { ok: false, error: "This booking is no longer active." };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { ok: true, demo: true, outstandingCents: outstanding };
  }

  // Create the Stripe PaymentIntent and write the pending payments row via
  // the admin client (clients don't have insert rights on `payments`).
  let intentId: string;
  let clientSecret: string;
  try {
    const intent = await createFinalBalanceIntent({
      amountCents: outstanding,
      bookingReference: reference,
      customerEmail: booking.client_email ?? user.email ?? "",
    });
    intentId = intent.id;
    clientSecret = intent.client_secret ?? "";
    if (!clientSecret) {
      return { ok: false, error: "Stripe did not return a client secret." };
    }
  } catch (e) {
    console.error("[bookings-pay] stripe failed", e);
    return { ok: false, error: "Couldn't open the payment. Try again." };
  }

  try {
    const admin = createSupabaseAdminClient();
    type PayInsert = {
      insert: (
        row: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    };
    await (admin.from("payments") as unknown as PayInsert).insert({
      booking_id: booking.id,
      kind: "final",
      status: "pending",
      amount_cents: outstanding,
      currency: "NZD",
      stripe_payment_intent: intentId,
    });
  } catch (e) {
    // Non-fatal: webhook will reconcile the payment from PaymentIntent metadata.
    console.warn("[bookings-pay] payments insert failed (non-fatal)", e);
  }

  return {
    ok: true,
    demo: false,
    clientSecret,
    outstandingCents: outstanding,
  };
}
