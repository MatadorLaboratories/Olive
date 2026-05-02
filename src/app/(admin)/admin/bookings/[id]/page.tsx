import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, FileText, Lock, Mail, MapPin, MessageCircle, Phone, User } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BookingStatusControls } from "@/components/admin/BookingStatusControls";
import { InternalNotes } from "@/components/admin/InternalNotes";
import { ShippingActions } from "@/components/admin/ShippingActions";
import { getBookingById } from "@/services/admin/bookings";
import { ensureBookingThread } from "@/services/admin/messaging";
import { getProducts } from "@/services/catalogue";
import { CUTOFF_DAYS } from "@/services/bookings";
import { formatDate, formatMoney } from "@/lib/format";

type Params = { id: string };

export default async function AdminBookingDetail({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  // Ensure a thread exists so admin's "Message thread" link is never dead.
  // Returns the existing thread id if one already exists.
  const threadId = await ensureBookingThread(booking.id, booking.reference);

  const products = await getProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  const today = new Date();
  const days = differenceInCalendarDays(parseISO(booking.eventDate), today);
  const insideCutoff = days <= CUTOFF_DAYS;
  const locked = booking.cutoffLocked && !booking.adminOverride;

  const outstanding = booking.totalCents - booking.depositPaidCents - booking.finalPaidCents;

  return (
    <div className="space-y-10 max-w-7xl">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        All bookings
      </Link>

      <PageHeader
        eyebrow={booking.reference}
        title={
          <>
            {booking.clientFullName ?? "Client"}
            <span className="block italic font-light text-olive-700/85 text-[0.7em] mt-2">
              {booking.deliveryAddress ?? "—"} · {formatDate(booking.eventDate, "long")}
            </span>
          </>
        }
        actions={
          <>
            <StatusBadge kind="booking" value={booking.status} />
            {locked ? (
              <span className="pill border-olive-700 text-olive-800">
                <Lock className="h-3 w-3" strokeWidth={1.5} />
                Locked
              </span>
            ) : insideCutoff ? (
              <span className="pill border-clay-300 text-clay-700">In cutoff window</span>
            ) : (
              <span className="pill border-olive-300 text-olive-600 tabular">{days}d to event</span>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Items */}
          <section className="card p-7">
            <h2 className="font-display text-2xl text-olive-900 mb-6">Linen & line items</h2>
            {booking.items.length === 0 ? (
              <p className="text-olive-600 italic font-display">No line items recorded for this booking.</p>
            ) : (
              <ul className="divide-y divide-[color:var(--color-rule-soft)]">
                {booking.items.map((it) => {
                  const p = productMap.get(it.productId);
                  return (
                    <li key={it.id} className="py-4 grid grid-cols-12 items-center gap-4">
                      <div className="col-span-7">
                        <p className="font-display text-lg text-olive-900 leading-tight">
                          {p?.name ?? it.productId}
                          {p?.colour && <span className="text-olive-600"> — {p.colour}</span>}
                        </p>
                        {p?.fabric && (
                          <p className="text-[12px] uppercase tracking-[0.12em] text-olive-500 mt-1">{p.fabric}</p>
                        )}
                      </div>
                      <p className="col-span-2 text-sm text-olive-700 tabular text-center">× {it.quantity}</p>
                      <p className="col-span-3 text-right font-display text-lg text-olive-900 tabular">
                        {formatMoney(it.lineTotalCents)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Delivery */}
          <section className="card p-7">
            <h2 className="font-display text-2xl text-olive-900 mb-6">Delivery & event</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Field icon={MapPin} label="Venue / address" value={booking.deliveryAddress} />
              <Field icon={MapPin} label="Region" value={booking.deliveryRegion} />
              <Field icon={Calendar} label="Delivery" value={formatDate(booking.deliveryDate, "long")} />
              <Field icon={Calendar} label="Return" value={formatDate(booking.returnDate, "long")} />
              <Field icon={Clock} label="Delivery window" value={booking.deliveryWindow} />
              <Field icon={Clock} label="Collection window" value={booking.collectionWindow} />
              <Field icon={User} label="On-site contact" value={booking.onSiteContact} />
              <Field icon={Mail} label="Client email" value={booking.clientEmail} />
              <Field icon={Phone} label="Client phone" value={booking.clientPhone} />
              <Field icon={FileText} label="Source" value={booking.source} />
            </dl>
            {booking.notesClient && (
              <div className="mt-7 pt-6 border-t border-[color:var(--color-rule-soft)]">
                <p className="eyebrow text-olive-600 mb-2">Notes from the client</p>
                <p className="text-olive-800 leading-relaxed">{booking.notesClient}</p>
              </div>
            )}
          </section>

          {/* Internal notes */}
          <InternalNotes bookingId={booking.id} initial={booking.notesInternal} />

          {/* Documents */}
          <section className="card p-7">
            <h2 className="font-display text-2xl text-olive-900 mb-6">Documents</h2>
            {booking.timelineUrl ? (
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-olive-500" strokeWidth={1.5} />
                  <span className="text-olive-800 truncate">{booking.timelineUrl}</span>
                  <span className="ml-auto pill text-olive-700 border-[color:var(--color-rule)]">Timeline</span>
                </li>
              </ul>
            ) : (
              <p className="text-olive-600 italic font-display">No documents uploaded yet.</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-8 self-start">
          {/* Money */}
          <div className="card p-7">
            <p className="eyebrow text-clay-500 mb-4">Money</p>
            <Row label="Subtotal" value={formatMoney(booking.subtotalCents)} />
            {booking.deliveryFeeCents > 0 && (
              <Row label="Delivery" value={formatMoney(booking.deliveryFeeCents)} />
            )}
            {booking.discountCents > 0 && (
              <Row label="Discount" value={`− ${formatMoney(booking.discountCents)}`} />
            )}
            <div className="pt-3 mt-3 border-t border-[color:var(--color-rule-soft)] flex items-baseline justify-between">
              <span className="eyebrow text-olive-700">Total</span>
              <span className="font-display text-2xl text-olive-900 tabular">{formatMoney(booking.totalCents)}</span>
            </div>
            <hr className="my-5" />
            <Row label="Deposit paid" value={formatMoney(booking.depositPaidCents)} />
            <Row label="Final paid" value={formatMoney(booking.finalPaidCents)} />
            <div className={`pt-3 mt-3 border-t border-[color:var(--color-rule-soft)] flex items-baseline justify-between ${outstanding > 0 ? "text-clay-600" : "text-olive-700"}`}>
              <span className="eyebrow">Outstanding</span>
              <span className="font-display text-xl tabular">{formatMoney(outstanding)}</span>
            </div>
            {booking.finalDueDate && (
              <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-olive-500 tabular">
                Final due {formatDate(booking.finalDueDate, "long")}
              </p>
            )}
          </div>

          {/* Status & override */}
          <div className="card p-7">
            <BookingStatusControls
              bookingId={booking.id}
              currentStatus={booking.status}
              override={booking.adminOverride}
            />
          </div>

          {/* Shipping */}
          <ShippingActions
            reference={booking.reference}
            address={booking.deliveryAddress}
            city={booking.deliveryCity}
          />

          {/* Quick links */}
          <div className="card p-7">
            <p className="eyebrow text-olive-600 mb-4">Quick links</p>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={threadId ? `/admin/messages/${threadId}` : "/admin/messages"}
                  className="lnk text-olive-800 inline-flex items-center gap-2"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Reply in studio inbox
                </Link>
              </li>
              <li>
                <Link href={`/account/bookings/${booking.reference}`} className="lnk text-olive-800 inline-flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Client-facing view
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
      <Icon className="h-4 w-4 text-olive-500 mt-1 shrink-0" strokeWidth={1.5} />
      <div className="min-w-0">
        <dt className="eyebrow text-olive-600 mb-1">{label}</dt>
        <dd className="text-olive-800 leading-snug capitalize">{value ?? "—"}</dd>
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
