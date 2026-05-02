import "server-only";
import type Stripe from "stripe";
import { format } from "date-fns";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTemplate } from "./email-templates";
import { generateAndStoreReceipt } from "./receipts";
import { getStripe } from "./payments";
import { site } from "@/config/site";
import { supabaseAvailable } from "./_supabase-available";

type BookingPaymentKind = "deposit" | "final";

export type ApplyBookingPaymentResult =
  | { ok: true; applied: boolean; reference: string }
  | { ok: false; error: string };

type IntentLike = Stripe.PaymentIntent & {
  charges?: { data?: Array<{ receipt_url?: string | null }> };
};

export async function applyBookingPayment(
  intent: Stripe.PaymentIntent,
  kind: BookingPaymentKind,
): Promise<ApplyBookingPaymentResult> {
  if (!supabaseAvailable()) {
    return { ok: false, error: "Database unavailable." };
  }

  const reference = intent.metadata?.booking_reference;
  if (!reference) {
    return { ok: false, error: "PaymentIntent missing booking_reference metadata." };
  }

  const admin = createSupabaseAdminClient();

  type PaySel = {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{
          data: { id: string; status: string } | null;
        }>;
      };
    };
  };
  const { data: existingPayment } = await (admin.from("payments") as unknown as PaySel)
    .select("id, status")
    .eq("stripe_payment_intent", intent.id)
    .maybeSingle();

  if (existingPayment?.status === "succeeded") {
    return { ok: true, applied: false, reference };
  }

  const chargeReceiptUrl = stripeReceiptUrlFrom(intent);

  type BookingSel = {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{
          data: {
            id: string;
            client_full_name: string | null;
            client_email: string | null;
            event_date: string | null;
            delivery_date: string | null;
            delivery_address: string | null;
            total_cents: number;
            subtotal_cents: number | null;
            delivery_fee_cents: number | null;
            discount_cents: number | null;
            final_due_date: string | null;
            deposit_paid_cents: number;
            final_paid_cents: number;
            booking_items: Array<{
              quantity: number;
              line_total_cents: number;
              unit_price_cents: number;
              notes: string | null;
              products: { name: string | null } | null;
            }> | null;
          } | null;
        }>;
      };
    };
  };
  const { data: booking } = await (admin.from("bookings") as unknown as BookingSel)
    .select(
      "id, client_full_name, client_email, event_date, delivery_date, delivery_address, total_cents, subtotal_cents, delivery_fee_cents, discount_cents, final_due_date, deposit_paid_cents, final_paid_cents, booking_items(quantity, line_total_cents, unit_price_cents, notes, products:product_id(name))",
    )
    .eq("reference", reference)
    .maybeSingle();

  if (!booking) {
    return { ok: false, error: `Booking ${reference} not found.` };
  }

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
    type PayInsert = {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
    await (admin.from("payments") as unknown as PayInsert).insert({
      booking_id: booking.id,
      kind,
      status: "succeeded",
      amount_cents: intent.amount,
      currency: "NZD",
      stripe_payment_intent: intent.id,
      paid_at: new Date().toISOString(),
      receipt_url: chargeReceiptUrl,
    });
  }

  const isDeposit = kind === "deposit";
  const nextDepositPaidCents = (booking.deposit_paid_cents ?? 0) + (isDeposit ? intent.amount : 0);
  const nextFinalPaidCents = (booking.final_paid_cents ?? 0) + (isDeposit ? 0 : intent.amount);

  type BookingUpd = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  await (admin.from("bookings") as unknown as BookingUpd)
    .update(
      isDeposit
        ? {
            status: "confirmed",
            confirmed_at: new Date().toISOString(),
            deposit_paid_cents: nextDepositPaidCents,
          }
        : {
            status: "final_paid",
            final_paid_cents: nextFinalPaidCents,
          },
    )
    .eq("id", booking.id);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(n);

  const recipient = intent.receipt_email ?? booking.client_email;
  if (recipient) {
    const firstName = (booking.client_full_name ?? "").split(" ")[0] ?? "there";
    const outstanding =
      (booking.total_cents ?? 0) - nextDepositPaidCents - nextFinalPaidCents;

    try {
      await sendTemplate({
        to: recipient,
        templateKey: isDeposit ? "booking.confirmation" : "booking.final_paid",
        vars: {
          reference,
          firstName,
          depositAmount: fmt(intent.amount / 100),
          amount: fmt(intent.amount / 100),
          eventDate: booking.event_date ? format(new Date(booking.event_date), "EEEE d MMMM yyyy") : "",
          deliveryDate: booking.delivery_date ? format(new Date(booking.delivery_date), "EEEE d MMMM") : "",
          venue: booking.delivery_address ?? "",
          outstandingAmount: fmt(Math.max(0, outstanding) / 100),
          finalDueDate: booking.final_due_date ? format(new Date(booking.final_due_date), "EEEE d MMMM") : "",
          portalUrl: `${site.url}/account`,
          total: fmt((booking.total_cents ?? 0) / 100),
        },
      });
    } catch (e) {
      console.warn("[bookings-fulfill] email failed (non-fatal)", e);
    }
  }

  const lineItems = (booking.booking_items ?? []).map((bi) => {
    const productName = bi.products?.name ?? "Linen item";
    return {
      label: productName,
      sublabel:
        bi.quantity > 1 ? `${bi.quantity} × ${fmt(bi.unit_price_cents / 100)}` : undefined,
      amountCents: bi.line_total_cents,
    };
  });
  if (booking.delivery_fee_cents && booking.delivery_fee_cents > 0) {
    lineItems.push({
      label: "Delivery & collection",
      sublabel: undefined,
      amountCents: booking.delivery_fee_cents,
    });
  }
  if (booking.discount_cents && booking.discount_cents > 0) {
    lineItems.push({
      label: "Discount applied",
      sublabel: undefined,
      amountCents: -booking.discount_cents,
    });
  }
  if (lineItems.length === 0) {
    lineItems.push({
      label: `Linen hire — ${reference}`,
      sublabel: booking.event_date
        ? `Event ${format(new Date(booking.event_date), "d MMMM yyyy")}`
        : undefined,
      amountCents: booking.total_cents ?? intent.amount,
    });
  }

  await generateAndStoreReceipt({
    paymentIntentId: intent.id,
    stripeChargeId: null,
    stripeReceiptUrl: chargeReceiptUrl,
    amountCents: intent.amount,
    paidAtIso: new Date().toISOString(),
    anchor: { kind: "booking", bookingId: booking.id },
    orderReference: reference,
    orderType: "booking",
    paymentLabel: isDeposit ? "Deposit" : "Final balance",
    lineItems,
    customer: {
      name: booking.client_full_name ?? recipient ?? "Customer",
      email: booking.client_email ?? recipient ?? null,
    },
    orderTotalCents: booking.total_cents ?? 0,
    previouslyPaidCents: (booking.deposit_paid_cents ?? 0) + (booking.final_paid_cents ?? 0),
  });

  return { ok: true, applied: true, reference };
}

export async function ensureBookingPaymentApplied(
  reference: string,
  paymentIntentId: string,
): Promise<ApplyBookingPaymentResult> {
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
    console.error("[bookings-fulfill] retrieve failed", e);
    return { ok: false, error: "Couldn't verify payment with Stripe." };
  }

  if (intent.status !== "succeeded") {
    return { ok: false, error: `Payment is ${intent.status}.` };
  }

  const intentReference = intent.metadata?.booking_reference;
  if (intentReference !== reference) {
    return { ok: false, error: "Payment reference mismatch." };
  }

  const kind = intent.metadata?.kind;
  if (kind !== "deposit" && kind !== "final") {
    return { ok: false, error: "Not a booking payment." };
  }

  return applyBookingPayment(intent, kind);
}

function stripeReceiptUrlFrom(intent: Stripe.PaymentIntent): string | null {
  const expanded = intent as IntentLike;
  if (expanded.charges?.data?.[0]?.receipt_url) {
    return expanded.charges.data[0].receipt_url;
  }
  const latestCharge = (intent as { latest_charge?: unknown }).latest_charge;
  if (latestCharge && typeof latestCharge === "object" && "receipt_url" in latestCharge) {
    return ((latestCharge as { receipt_url?: string | null }).receipt_url) ?? null;
  }
  return null;
}
