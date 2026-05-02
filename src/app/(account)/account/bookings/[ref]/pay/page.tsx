import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import { getBookingByReference } from "@/services/bookings-read";
import { createFinalBalanceIntentForBooking } from "@/services/bookings-pay";
import { StripePaymentForm } from "@/components/booking/StripePaymentForm";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Pay final balance" };

type Params = { ref: string };

export default async function PayFinalBalancePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { ref } = await params;

  const booking = await getBookingByReference(ref);
  if (!booking) notFound();

  const result = await createFinalBalanceIntentForBooking(ref);

  // Errors render as a small inline notice rather than a 500.
  if (!result.ok) {
    return <PayError reference={ref} message={result.error} />;
  }

  const outstanding = result.demo
    ? booking.totalCents - booking.depositPaidCents - booking.finalPaidCents
    : result.outstandingCents;

  return (
    <div className="space-y-10">
      <Link
        href={`/account/bookings/${ref}`}
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Back to booking
      </Link>

      <header>
        <p className="eyebrow flex items-center gap-3 mb-4">
          <span className="inline-block h-px w-10 bg-olive-700/40" />
          {booking.reference} · Final balance
        </p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05] tracking-tight">
          Final balance,{" "}
          <span className="italic font-light text-olive-700/85">
            settled neatly.
          </span>
        </h1>
        <p className="mt-4 text-olive-800/85 max-w-xl leading-relaxed">
          Paying {formatMoney(outstanding)} for{" "}
          <span className="text-olive-900">
            {booking.deliveryAddress ?? "your event"}
          </span>{" "}
          on {formatDate(booking.eventDate, "long")}.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          {result.demo ? (
            <DemoNotice reference={booking.reference} />
          ) : (
            <article className="card p-7">
              <p className="eyebrow text-clay-500 mb-5">Card details</p>
              <StripePaymentForm
                clientSecret={result.clientSecret}
                reference={booking.reference}
                returnPath={`/account/bookings/${booking.reference}?paid=final`}
                ctaLabel={`Pay ${formatMoney(outstanding)} & finish`}
              />
            </article>
          )}
        </div>

        <aside className="lg:col-span-5">
          <article className="card p-7">
            <p className="eyebrow text-clay-500 mb-4">Summary</p>
            <Row label="Booking total" value={formatMoney(booking.totalCents)} />
            <Row label="Deposit paid" value={formatMoney(booking.depositPaidCents)} />
            {booking.finalPaidCents > 0 && (
              <Row label="Final paid (so far)" value={formatMoney(booking.finalPaidCents)} />
            )}
            <div className="mt-5 pt-5 border-t border-[color:var(--border-base)] flex items-baseline justify-between">
              <span className="eyebrow text-clay-600">Due now</span>
              <span className="font-display text-[clamp(1.5rem,2vw,1.875rem)] text-clay-600 tabular">
                {formatMoney(outstanding)}
              </span>
            </div>
            {booking.finalDueDate && (
              <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-olive-500">
                Originally due {formatDate(booking.finalDueDate, "long")}
              </p>
            )}
          </article>

          <p className="mt-5 text-[11px] uppercase tracking-[0.16em] text-olive-500 inline-flex items-center gap-2">
            <Lock className="h-3 w-3" strokeWidth={1.5} />
            Secured by Stripe · NZD
          </p>
        </aside>
      </div>
    </div>
  );
}

function DemoNotice({ reference }: { reference: string }) {
  return (
    <article className="card p-7 border-clay-300/60 bg-clay-50/50">
      <div className="flex items-start gap-3">
        <Sparkles
          className="h-4 w-4 text-clay-500 mt-1 shrink-0"
          strokeWidth={1.5}
        />
        <div>
          <p className="eyebrow text-clay-600 mb-2">Demo mode</p>
          <p className="font-display text-2xl text-olive-900 leading-snug">
            Stripe credentials aren't connected for this preview, so the
            Payment Element is paused.
          </p>
          <p className="mt-4 text-sm text-olive-700 leading-relaxed">
            With <code className="font-mono text-[12px]">STRIPE_SECRET_KEY</code> set
            and a real booking row in Supabase, this page mounts the Stripe
            Payment Element with the booking's outstanding balance pre-filled,
            and the webhook flips the booking to{" "}
            <code className="font-mono text-[12px]">final_paid</code> on success.
          </p>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href={`/account/bookings/${reference}`}
          className="btn btn-secondary"
        >
          Back to booking
        </Link>
      </div>
    </article>
  );
}

function PayError({
  reference,
  message,
}: {
  reference: string;
  message: string;
}) {
  return (
    <div className="space-y-8 max-w-xl">
      <Link
        href={`/account/bookings/${reference}`}
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Back to booking
      </Link>

      <header>
        <p className="eyebrow text-clay-500 mb-3">We hit a snag</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Couldn't open the payment.
        </h1>
        <p className="mt-4 text-olive-800/85 leading-relaxed">{message}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/account/bookings/${reference}/messages`}
          className="btn"
        >
          Message the studio
        </Link>
        <Link
          href={`/account/bookings/${reference}`}
          className="btn btn-secondary"
        >
          Back to booking
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm py-1.5">
      <span className="eyebrow text-olive-600">{label}</span>
      <span className="text-olive-800 tabular">{value}</span>
    </div>
  );
}
