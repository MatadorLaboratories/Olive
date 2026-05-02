import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazy-initialised Stripe client (server-only). */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  // Use the SDK's pinned API version to avoid drift on Stripe-side changes.
  _stripe = new Stripe(key);
  return _stripe;
}

/**
 * Create a deposit PaymentIntent for a booking.
 * Phase 2 wires this from the booking deposit step.
 */
export async function createDepositIntent(args: {
  amountCents: number;
  bookingReference: string;
  customerEmail: string;
}) {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: args.amountCents,
    currency: "nzd",
    receipt_email: args.customerEmail,
    metadata: {
      booking_reference: args.bookingReference,
      kind: "deposit",
    },
    description: `Olive Linen — deposit ${args.bookingReference}`,
  });
}

/** Create a final-balance PaymentIntent. */
export async function createFinalBalanceIntent(args: {
  amountCents: number;
  bookingReference: string;
  customerEmail: string;
}) {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: args.amountCents,
    currency: "nzd",
    receipt_email: args.customerEmail,
    metadata: {
      booking_reference: args.bookingReference,
      kind: "final",
    },
    description: `Olive Linen — final balance ${args.bookingReference}`,
  });
}

/**
 * Custom-order PaymentIntent helper.
 *
 * Mirrors the booking variant but writes a different `kind` so the webhook
 * can branch onto the custom-order code path. `mode` distinguishes a 50%
 * deposit vs. paying the full quote; both use the `custom_order_*` reserved
 * `kind` values to keep the webhook switch tight.
 */
export async function createCustomOrderIntent(args: {
  amountCents: number;
  customOrderReference: string;
  customerEmail: string;
  mode: "deposit" | "full";
}) {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: args.amountCents,
    currency: "nzd",
    receipt_email: args.customerEmail,
    metadata: {
      custom_order_reference: args.customOrderReference,
      kind: args.mode === "deposit" ? "custom_order_deposit" : "custom_order_full",
    },
    description: `Olive Linen — custom order ${args.customOrderReference} (${args.mode})`,
  });
}
