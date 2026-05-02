import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/services/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "@/services/_supabase-available";
import { applyCustomOrderPayment } from "@/services/custom-orders-fulfill";
import { applyBookingPayment } from "@/services/bookings-fulfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook receiver.
 *
 * Responsibilities:
 *  - verify signature
 *  - update `payments.status` for the matching PaymentIntent
 *  - flip the booking's `status` based on the payment kind
 *  - send a transactional confirmation email to the client
 *
 * Idempotent: re-deliveries are no-ops if the payment is already `succeeded`.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret." }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe.webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      await handlePaymentSucceeded(intent);
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      await handlePaymentFailed(intent);
      break;
    }
    default:
      // Other event types are ignored for now.
      break;
  }

  return NextResponse.json({ received: true });
}

type PI = {
  id: string;
  amount: number;
  receipt_email: string | null;
  metadata: Record<string, string | undefined>;
  charges?: { data?: Array<{ receipt_url?: string | null }> };
};

async function handlePaymentSucceeded(intent: PI) {
  const kind = intent.metadata?.kind ?? "deposit";

  console.info("[stripe.webhook] payment_intent.succeeded", {
    id: intent.id,
    kind,
    bookingReference: intent.metadata?.booking_reference,
    customOrderReference: intent.metadata?.custom_order_reference,
    amount: intent.amount,
  });

  if (!supabaseAvailable()) return;

  // Branch by kind. Custom-order payments live on a separate table and
  // delegate to a shared fulfillment service so the customer's
  // confirmation page can apply the same effects synchronously when the
  // webhook is racing the redirect.
  if (kind === "custom_order_deposit" || kind === "custom_order_full") {
    const result = await applyCustomOrderPayment(
      intent as unknown as Stripe.PaymentIntent,
      kind,
    );
    if (!result.ok) {
      console.error("[stripe.webhook] custom-order apply failed", result.error);
    }
    return;
  }

  const reference = intent.metadata?.booking_reference;
  if (!reference) return;
  const result = await applyBookingPayment(
    intent as unknown as Stripe.PaymentIntent,
    kind === "final" ? "final" : "deposit",
  );
  if (!result.ok) {
    console.error("[stripe.webhook] booking apply failed", result.error);
  }
}

async function handlePaymentFailed(intent: PI) {
  console.warn("[stripe.webhook] payment_failed", intent.id);
  if (!supabaseAvailable()) return;

  const admin = createSupabaseAdminClient();
  type PayUpdate = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  await (admin.from("payments") as unknown as PayUpdate)
    .update({ status: "failed" })
    .eq("stripe_payment_intent", intent.id);
}
