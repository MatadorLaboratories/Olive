import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { getBookingByReference } from "@/services/bookings-read";
import { getProducts } from "@/services/catalogue";
import { CUTOFF_DAYS } from "@/services/bookings";
import { ensureBookingPaymentApplied } from "@/services/bookings-fulfill";
import { formatDate, formatMoney } from "@/lib/format";
import { TimelineUpload } from "@/components/portal/TimelineUpload";

type Params = { ref: string };
type Search = {
  paid?: string;
  payment_intent?: string;
  redirect_status?: string;
};

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const [{ ref }, { paid, payment_intent, redirect_status }] = await Promise.all([params, searchParams]);

  let fulfillError: string | null = null;
  if (payment_intent && (redirect_status ?? "succeeded") === "succeeded") {
    const result = await ensureBookingPaymentApplied(ref, payment_intent);
    if (!result.ok) {
      console.warn("[booking detail] fulfill failed", result.error);
      fulfillError = result.error;
    }
  }

  const booking = await getBookingByReference(ref);
  if (!booking) notFound();

  const products = await getProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  const daysUntil = differenceInCalendarDays(parseISO(booking.eventDate), new Date());
  const insideCutoff = daysUntil <= CUTOFF_DAYS;
  const isLocked = booking.cutoffLocked || (insideCutoff && !booking.adminOverride);

  const outstanding =
    booking.totalCents - booking.depositPaidCents - booking.finalPaidCents;
  const justPaidFinal = paid === "final";

  return (
    <div className="space-y-10">
      <Link
        href="/account/bookings"
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        All bookings
      </Link>

      {/* Title block */}
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow flex items-center gap-3 mb-3">
            <span className="inline-block h-px w-10 bg-olive-700/40" />
            <span className="tabular">{booking.reference}</span>
          </p>
          <h1 className="font-display text-display-lg text-olive-900 leading-[1.02] tracking-tight">
            {booking.deliveryAddress ?? "Your event"}
          </h1>
          <p className="mt-3 text-olive-700/85 italic font-display text-xl">
            {formatDate(booking.eventDate, "long")}
          </p>
        </div>
        <div className="lg:col-span-5 flex flex-wrap items-center gap-3">
          <span className="pill border-clay-300 text-clay-700 capitalize">
            {booking.status.replace(/_/g, " ")}
          </span>
          {isLocked ? (
            <span className="pill border-olive-700 text-olive-800">
              <Lock className="h-3 w-3" strokeWidth={1.5} />
              30-day lock
            </span>
          ) : (
            <span className="pill border-olive-300 text-olive-600 tabular">
              {daysUntil} days until event
            </span>
          )}
        </div>
      </header>

      {/* Just-paid confirmation banner (one-off, after Stripe redirect) */}
      {justPaidFinal && outstanding <= 0 && (
        <div
          className="card p-5 border-olive-300/60 bg-olive-50 flex items-start gap-3"
          role="status"
        >
          <CheckCircle2
            className="h-4 w-4 text-olive-700 mt-0.5 shrink-0"
            strokeWidth={1.5}
          />
          <div>
            <p className="eyebrow text-olive-700 mb-1">Final balance received</p>
            <p className="text-sm text-olive-800 leading-relaxed">
              Thank you. You're fully paid up — we'll be in touch a few days
              before the event to confirm timings.
            </p>
          </div>
        </div>
      )}

      {fulfillError && (
        <div className="card p-5 border-clay-300/60 bg-clay-50/50" role="status">
          <p className="eyebrow text-clay-600 mb-2">Payment is still syncing</p>
          <p className="text-sm text-olive-800 leading-relaxed">
            We couldn't verify this payment instantly. If your bank has already approved it,
            the booking will update within a minute as Stripe finishes syncing. ({fulfillError})
          </p>
        </div>
      )}

      {/* Lock notice */}
      {isLocked && (
        <div className="card p-6 flex items-start gap-3">
          <Lock
            className="h-4 w-4 text-olive-700 mt-0.5 shrink-0"
            strokeWidth={1.5}
          />
          <div>
            <p className="eyebrow text-olive-700 mb-2">Your booking is locked</p>
            <p className="text-sm text-olive-800 leading-relaxed">
              You're inside the 30-day window — stock and laundering are
              committed. Need to make a change?{" "}
              <Link
                href={`/account/bookings/${booking.reference}/messages`}
                className="lnk"
              >
                Message the studio
              </Link>{" "}
              and we'll handle it.
            </p>
          </div>
        </div>
      )}

      {/* Outstanding balance call-to-pay */}
      {outstanding > 0 && (
        <div className="card p-7 border-clay-300/60 bg-clay-50/40">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="eyebrow text-clay-600 mb-1">Final balance</p>
              <p className="font-display text-3xl text-olive-900 tabular">
                {formatMoney(outstanding)}
              </p>
              <p className="text-sm text-olive-700 mt-2">
                Due{" "}
                {booking.finalDueDate
                  ? formatDate(booking.finalDueDate, "long")
                  : "30 days before event"}
              </p>
            </div>
            <Link
              href={`/account/bookings/${booking.reference}/pay`}
              className="btn btn-lg"
            >
              Pay final balance
            </Link>
          </div>
        </div>
      )}

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          {/* Items */}
          <section className="card p-7">
            <h2 className="font-display text-2xl text-olive-900 mb-6">Linen</h2>
            <ul className="divide-y divide-[color:var(--border-hairline)]">
              {booking.items.map((it) => {
                const p = productMap.get(it.productId);
                return (
                  <li
                    key={it.id}
                    className="py-4 grid grid-cols-12 items-center gap-4"
                  >
                    <div className="col-span-7">
                      <p className="font-display text-lg text-olive-900 leading-tight">
                        {p?.name ?? it.productId}
                        {p?.colour && (
                          <span className="text-olive-600"> — {p.colour}</span>
                        )}
                      </p>
                      {p?.fabric && (
                        <p className="text-[12px] uppercase tracking-[0.12em] text-olive-500 mt-1">
                          {p.fabric}
                        </p>
                      )}
                    </div>
                    <p className="col-span-2 text-sm text-olive-700 tabular text-center">
                      × {it.quantity}
                    </p>
                    <p className="col-span-3 text-right font-display text-lg text-olive-900 tabular">
                      {formatMoney(it.lineTotalCents)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Delivery & contact */}
          <section className="card p-7">
            <h2 className="font-display text-2xl text-olive-900 mb-6">Delivery</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <Field
                icon={MapPin}
                label="Venue / address"
                value={booking.deliveryAddress}
              />
              <Field
                icon={Calendar}
                label="Delivery date"
                value={formatDate(booking.deliveryDate, "long")}
              />
              <Field
                icon={Clock}
                label="Delivery window"
                value={booking.deliveryWindow}
              />
              <Field
                icon={Clock}
                label="Collection window"
                value={booking.collectionWindow}
              />
              <Field
                icon={Calendar}
                label="Return date"
                value={formatDate(booking.returnDate, "long")}
              />
              <Field
                icon={FileText}
                label="On-site contact"
                value={booking.onSiteContact}
              />
            </dl>
            {booking.notesClient && (
              <div className="mt-7 pt-6 border-t border-[color:var(--border-hairline)]">
                <p className="eyebrow text-olive-600 mb-2">Notes for the studio</p>
                <p className="text-olive-800 leading-relaxed">
                  {booking.notesClient}
                </p>
              </div>
            )}

            {/* Real action: message the studio about a change. The dead
                "Edit details" button has been retired — clients always go
                via the studio for changes, lock window or not. */}
            <div className="mt-8 pt-6 border-t border-[color:var(--border-hairline)]">
              <Link
                href={`/account/bookings/${booking.reference}/messages`}
                className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-800 hover:text-clay-600 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                Need to tweak something? Message the studio
              </Link>
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-32 self-start">
          {/* Payment summary */}
          <div className="card p-7">
            <p className="eyebrow text-clay-500 mb-4">Payment</p>
            <Row label="Subtotal" value={formatMoney(booking.subtotalCents)} />
            {booking.deliveryFeeCents > 0 && (
              <Row
                label="Delivery"
                value={formatMoney(booking.deliveryFeeCents)}
              />
            )}
            <div className="pt-3 mt-3 border-t border-[color:var(--border-hairline)] flex items-baseline justify-between">
              <span className="eyebrow text-olive-700">Total</span>
              <span className="font-display text-2xl text-olive-900 tabular">
                {formatMoney(booking.totalCents)}
              </span>
            </div>
            <hr className="my-5 border-[color:var(--border-hairline)]" />
            <Row label="Deposit paid" value={formatMoney(booking.depositPaidCents)} />
            <Row label="Final paid" value={formatMoney(booking.finalPaidCents)} />
            <div className="pt-3 mt-3 border-t border-[color:var(--border-hairline)] flex items-baseline justify-between">
              <span className="eyebrow text-clay-600">Outstanding</span>
              <span
                className={`font-display text-xl tabular ${outstanding > 0 ? "text-clay-600" : "text-olive-700"}`}
              >
                {formatMoney(outstanding)}
              </span>
            </div>
          </div>

          {/* Timeline upload */}
          <TimelineUpload bookingReference={booking.reference} />

          {/* Quick actions */}
          <div className="card p-7">
            <p className="eyebrow text-olive-600 mb-4">Studio</p>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/account/bookings/${booking.reference}/messages`}
                  className="lnk text-olive-800"
                >
                  Message the studio
                </Link>
              </li>
              <li>
                <Link
                  href="/account/documents"
                  className="lnk text-olive-800"
                >
                  Documents & invoices
                </Link>
              </li>
              <li>
                <Link
                  href="/account/bookings"
                  className="lnk text-olive-800"
                >
                  All bookings
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        className="h-4 w-4 text-olive-500 mt-1 shrink-0"
        strokeWidth={1.5}
      />
      <div className="min-w-0">
        <dt className="eyebrow text-olive-600 mb-1">{label}</dt>
        <dd className="text-olive-800 leading-snug">{value ?? "—"}</dd>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm py-1">
      <span className="eyebrow text-olive-600">{label}</span>
      <span className="text-olive-800 tabular">{value}</span>
    </div>
  );
}
