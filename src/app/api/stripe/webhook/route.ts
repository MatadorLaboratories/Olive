import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/services/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTemplate } from "@/services/email-templates";
import { supabaseAvailable } from "@/services/_supabase-available";
import { site } from "@/config/site";
import { format } from "date-fns";

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
  const reference = intent.metadata?.booking_reference;

  console.info("[stripe.webhook] payment_intent.succeeded", {
    id: intent.id,
    kind,
    reference,
    amount: intent.amount,
  });

  if (!supabaseAvailable() || !reference) return;

  const admin = createSupabaseAdminClient();

  // 1. Mark the payment row succeeded.
  type PayUpdate = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  await (admin.from("payments") as unknown as PayUpdate)
    .update({
      status: "succeeded",
      paid_at: new Date().toISOString(),
      receipt_url: intent.charges?.data?.[0]?.receipt_url ?? null,
    })
    .eq("stripe_payment_intent", intent.id);

  // 2. Look up the booking and transition its status.
  type BookingSelect = {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: { id: string; total_cents: number; deposit_paid_cents: number; final_paid_cents: number } | null }>;
      };
    };
  };
  const { data: booking } = await (admin.from("bookings") as unknown as BookingSelect)
    .select("id, total_cents, deposit_paid_cents, final_paid_cents")
    .eq("reference", reference)
    .maybeSingle();

  if (!booking) return;

  const isDeposit = kind === "deposit";
  type BookingUpdate = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  await (admin.from("bookings") as unknown as BookingUpdate)
    .update(
      isDeposit
        ? {
            status: "confirmed",
            confirmed_at: new Date().toISOString(),
            deposit_paid_cents: (booking.deposit_paid_cents ?? 0) + intent.amount,
          }
        : {
            status: "final_paid",
            final_paid_cents: (booking.final_paid_cents ?? 0) + intent.amount,
          },
    )
    .eq("id", booking.id);

  // 3. Send confirmation email via template (non-blocking on failure).
  if (intent.receipt_email) {
    type BookingFull = {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { client_full_name: string | null; event_date: string | null; delivery_date: string | null; delivery_address: string | null; total_cents: number; final_due_date: string | null } | null }>;
        };
      };
    };
    const { data: full } = await (admin.from("bookings") as unknown as BookingFull)
      .select("client_full_name, event_date, delivery_date, delivery_address, total_cents, final_due_date")
      .eq("id", booking.id)
      .maybeSingle();

    const firstName = (full?.client_full_name ?? "").split(" ")[0] ?? "there";
    const eventDate = full?.event_date ? format(new Date(full.event_date), "EEEE d MMMM yyyy") : "";
    const deliveryDate = full?.delivery_date ? format(new Date(full.delivery_date), "EEEE d MMMM") : "";
    const finalDueDate = full?.final_due_date ? format(new Date(full.final_due_date), "EEEE d MMMM") : "";
    const total = (full?.total_cents ?? 0) / 100;
    const outstanding = (full?.total_cents ?? 0) - (booking.deposit_paid_cents + intent.amount + booking.final_paid_cents);
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(n);

    await sendTemplate({
      to: intent.receipt_email,
      templateKey: isDeposit ? "booking.confirmation" : "booking.final_paid",
      vars: {
        reference,
        firstName,
        depositAmount: fmt(intent.amount / 100),
        amount: fmt(intent.amount / 100),
        eventDate,
        deliveryDate,
        venue: full?.delivery_address ?? "",
        outstandingAmount: fmt(Math.max(0, outstanding) / 100),
        finalDueDate,
        portalUrl: `${site.url}/account`,
        total: fmt(total),
      },
    });
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

