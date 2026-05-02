import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { getCustomOrderForCurrentUser } from "@/services/custom-orders-read";
import { ensureCustomOrderPaymentApplied } from "@/services/custom-orders-fulfill";
import { formatMoney } from "@/lib/format";

type Params = { reference: string };
type Search = {
  redirect_status?: string;
  payment_intent?: string;
};

/**
 * Post-payment confirmation for custom orders.
 *
 * Stripe redirects here from `confirmPayment` with `?payment_intent=` and
 * `?redirect_status=`. The Stripe webhook may have already applied the
 * payment, may be racing the redirect, or may not be configured at all
 * (dev without `stripe listen`). Either way, we run a synchronous
 * fulfillment check here so the customer always sees the truth:
 *
 *   - Pull the PaymentIntent from Stripe (server-side, by id).
 *   - Verify status === "succeeded" + metadata reference matches URL.
 *   - Idempotently apply the same DB updates the webhook would. If the
 *     webhook already ran, the helper returns `applied: false` and is a
 *     no-op.
 *
 * Then we re-read the order so the totals + status reflect reality.
 */
export default async function CustomOrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const [{ reference }, sp] = await Promise.all([params, searchParams]);

  // Fulfill synchronously when Stripe handed us an intent id and it
  // succeeded. Errors are swallowed — we still want to render the page so
  // the customer sees something useful, even if the apply step had a
  // transient failure (the webhook will catch up).
  let fulfillError: string | null = null;
  if (sp.payment_intent && (sp.redirect_status ?? "succeeded") === "succeeded") {
    const result = await ensureCustomOrderPaymentApplied(
      reference,
      sp.payment_intent,
    );
    if (!result.ok) {
      console.warn("[custom-order confirmation] fulfill failed", result.error);
      fulfillError = result.error;
    }
  }

  const order = await getCustomOrderForCurrentUser(reference);
  if (!order) notFound();

  const succeeded = (sp.redirect_status ?? "succeeded") === "succeeded";
  const quote = order.quoteTotalCents ?? 0;
  const totalPaid = order.totalPaidCents ?? 0;
  const outstanding = Math.max(0, quote - totalPaid);
  const fullyPaid = quote > 0 && outstanding === 0;

  return (
    <div className="space-y-10 max-w-2xl">
      <div className="card p-10 text-center">
        {succeeded ? (
          <CheckCircle2
            className="h-7 w-7 text-olive-700 mx-auto mb-4"
            strokeWidth={1.5}
            aria-hidden
          />
        ) : (
          <Sparkles
            className="h-7 w-7 text-clay-500 mx-auto mb-4"
            strokeWidth={1.5}
            aria-hidden
          />
        )}

        <p className="eyebrow text-clay-500 mb-3">
          {succeeded ? "Payment received" : "Almost there"}
        </p>
        <h1 className="font-display text-display-lg text-olive-900 leading-[1]">
          {succeeded ? (
            <>
              Thank you. <span className="italic font-light">We've got it.</span>
            </>
          ) : (
            <>
              We're <span className="italic font-light">processing your card.</span>
            </>
          )}
        </h1>
        <p className="mt-6 text-olive-800/85 leading-relaxed">
          {succeeded
            ? `Your payment for custom order ${order.reference} is confirmed${fullyPaid ? " — paid in full" : ""}. Your receipt is in the dashboard documents area.`
            : "Some banks take a few seconds to confirm. Your order detail will reflect the latest status as soon as we hear back."}
        </p>

        {quote > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-6 text-left max-w-md mx-auto">
            <div>
              <p className="eyebrow text-olive-500 mb-1">Quote</p>
              <p className="font-display text-xl text-olive-900 tabular">
                {formatMoney(quote)}
              </p>
            </div>
            <div>
              <p className="eyebrow text-olive-500 mb-1">Paid</p>
              <p className="font-display text-xl text-olive-900 tabular">
                {formatMoney(totalPaid)}
              </p>
            </div>
            <div>
              <p className="eyebrow text-olive-500 mb-1">Outstanding</p>
              <p
                className={`font-display text-xl tabular ${
                  outstanding > 0 ? "text-clay-600" : "text-olive-700"
                }`}
              >
                {outstanding > 0 ? formatMoney(outstanding) : "Paid"}
              </p>
            </div>
          </div>
        )}

        {fulfillError && (
          <p className="mt-6 text-[12px] uppercase tracking-[0.14em] text-clay-600">
            We couldn't verify the payment instantly — your order will update
            within a minute as the webhook lands. ({fulfillError})
          </p>
        )}

        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href={`/account/custom-orders/${order.reference}`}
            className="btn"
          >
            View order
          </Link>
          <Link href="/account/documents" className="btn btn-secondary">
            Receipt & documents
          </Link>
          <Link
            href="/account/custom-orders"
            className="text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
          >
            All custom orders
          </Link>
        </div>
      </div>
    </div>
  );
}
