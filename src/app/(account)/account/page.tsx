import Link from "next/link";
import { ArrowUpRight, Calendar, CreditCard, FileText, Sparkles } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { getBookingsForCurrentUser } from "@/services/bookings-read";
import { getDocumentsForCurrentUser } from "@/services/documents";
import { getCustomOrdersForCurrentUser } from "@/services/custom-orders-read";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatMoney } from "@/lib/format";

export default async function AccountDashboard() {
  const [bookings, documents, customOrders] = await Promise.all([
    getBookingsForCurrentUser(),
    getDocumentsForCurrentUser(),
    getCustomOrdersForCurrentUser(),
  ]);
  const upcoming = bookings.find(
    (b) => !["completed", "cancelled", "archived"].includes(b.status),
  );

  const outstanding = upcoming
    ? upcoming.totalCents - upcoming.depositPaidCents - upcoming.finalPaidCents
    : 0;

  const activeCustomOrders = customOrders.filter(
    (o) => !["completed", "cancelled"].includes(o.status),
  );

  // Active quotes that still need money — surfaced as documents in the
  // documents area, so we count them under "Documents" too.
  const activeQuoteCount = customOrders.filter((o) => {
    if (!["quote_sent", "deposit_paid", "in_production", "ready"].includes(o.status))
      return false;
    const quote = o.quoteTotalCents ?? 0;
    if (quote <= 0) return false;
    return quote - (o.totalPaidCents ?? 0) > 0;
  }).length;
  const documentsHeadcount = documents.length + activeQuoteCount;

  const daysUntil = upcoming
    ? differenceInCalendarDays(parseISO(upcoming.eventDate), new Date())
    : null;

  return (
    <div className="space-y-12">
      <header>
        <p className="eyebrow mb-3">Your studio</p>
        <h1 className="font-display text-display-lg text-olive-900 leading-[1]">
          Hello,{" "}
          <span className="italic font-light">
            {(upcoming?.clientFullName ?? "friend").split(" ")[0]}.
          </span>
        </h1>
        {upcoming ? (
          <p className="mt-4 text-olive-800/80 text-lg max-w-xl">
            {upcoming.status === "confirmed" && daysUntil !== null
              ? `Your event is ${daysUntil} days out. ${outstanding > 0 ? `${formatMoney(outstanding)} balance to pay.` : "Fully paid."}`
              : "Your booking is in progress."}
          </p>
        ) : (
          <p className="mt-4 text-olive-800/80 text-lg max-w-xl">
            No bookings yet. Start one anytime — we'll save the draft.
          </p>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            label: "Next event",
            value: upcoming ? formatDate(upcoming.eventDate, "short") : "—",
            icon: Calendar,
            href: "/account/bookings",
          },
          {
            label: "Outstanding balance",
            value: outstanding > 0 ? formatMoney(outstanding) : "Paid",
            icon: CreditCard,
            href: "/account/bookings",
          },
          {
            label: "Custom orders",
            value:
              activeCustomOrders.length > 0
                ? String(activeCustomOrders.length)
                : "—",
            icon: Sparkles,
            href: "/account/custom-orders",
          },
          { label: "Documents", value: String(documentsHeadcount), icon: FileText, href: "/account/documents" },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="card p-6 group transition-colors hover:border-olive-300"
          >
            <div className="flex items-start justify-between">
              <p className="eyebrow text-olive-600">{c.label}</p>
              <c.icon className="h-4 w-4 text-olive-500 group-hover:text-clay-500 transition-colors" strokeWidth={1.5} />
            </div>
            <p className="mt-6 font-display text-3xl text-olive-900 tabular leading-none">
              {c.value}
            </p>
          </Link>
        ))}
      </section>

      {upcoming && (
        <section className="card p-8">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-2xl text-olive-900">Your booking</h2>
            <Link
              href={`/account/bookings/${upcoming.reference}`}
              className="text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 inline-flex items-center gap-1"
            >
              View detail
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="eyebrow text-olive-500 mb-1">Order</p>
              <p className="font-display text-xl text-olive-900 tabular">{upcoming.reference}</p>
            </div>
            <div>
              <p className="eyebrow text-olive-500 mb-1">Event</p>
              <p className="font-display text-xl text-olive-900">{formatDate(upcoming.eventDate, "short")}</p>
            </div>
            <div>
              <p className="eyebrow text-olive-500 mb-1">Status</p>
              <p className="pill border-clay-300 text-clay-700 capitalize">
                {upcoming.status.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="eyebrow text-olive-500 mb-1">Final due</p>
              <p className="font-display text-xl text-olive-900">
                {upcoming.finalDueDate ? formatDate(upcoming.finalDueDate, "short") : "—"}
              </p>
            </div>
          </div>
        </section>
      )}

      {!upcoming && (
        <section className="card p-10 text-center">
          <p className="font-display text-2xl text-olive-900 italic font-light leading-snug">
            Nothing on the calendar yet.
          </p>
          <Link href="/hire" className="btn mt-6">Start a hire</Link>
        </section>
      )}

      {activeCustomOrders.length > 0 && (
        <section className="card p-8">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-2xl text-olive-900">
              Custom <span className="italic font-light">orders.</span>
            </h2>
            <Link
              href="/account/custom-orders"
              className="text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 inline-flex items-center gap-1"
            >
              All custom orders
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
          <ul className="divide-y divide-[color:var(--border-hairline)]">
            {activeCustomOrders.slice(0, 3).map((o) => {
              const customOutstanding =
                (o.quoteTotalCents ?? 0) - (o.totalPaidCents ?? 0);
              return (
                <li key={o.id}>
                  <Link
                    href={`/account/custom-orders/${o.reference}`}
                    className="grid grid-cols-12 gap-4 py-4 items-baseline group hover:bg-cream-50/40 transition-colors -mx-2 px-2 rounded-md"
                  >
                    <div className="col-span-12 md:col-span-3">
                      <p className="font-display text-lg text-olive-900 tabular">
                        {o.reference}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
                        {formatDate(o.createdAt, "short")}
                      </p>
                    </div>
                    <div className="col-span-12 md:col-span-4 text-olive-800 capitalize text-sm">
                      {[o.fabric, o.edgeStyle, o.colour].filter(Boolean).join(" · ") || "—"}
                    </div>
                    <div className="col-span-6 md:col-span-3 text-sm">
                      {o.quoteTotalCents ? (
                        customOutstanding > 0 ? (
                          <span className="text-clay-600 tabular">
                            {formatMoney(customOutstanding)} due
                          </span>
                        ) : (
                          <span className="text-olive-700">Paid</span>
                        )
                      ) : (
                        <span className="text-olive-700 italic font-light">
                          Awaiting quote
                        </span>
                      )}
                    </div>
                    <div className="col-span-6 md:col-span-2 flex justify-end">
                      <StatusBadge kind="custom" value={o.status} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
