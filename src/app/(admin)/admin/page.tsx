import Link from "next/link";
import { ArrowUpRight, Bell, Calendar, ChevronRight, CircleAlert, Package, Truck, Wallet } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getAllBookings, getDashboardSnapshot } from "@/services/admin/bookings";
import { formatDate, formatMoney } from "@/lib/format";

export default async function AdminDashboard() {
  const [bookings, snapshot] = await Promise.all([
    getAllBookings({ sort: "soonest" }),
    getDashboardSnapshot(),
  ]);

  const today = new Date();
  const upcoming = bookings
    .filter((b) => !["cancelled", "archived", "completed"].includes(b.status))
    .slice(0, 5);

  const todos = bookings
    .filter((b) => {
      const outstanding = b.totalCents - b.depositPaidCents - b.finalPaidCents;
      const days = differenceInCalendarDays(parseISO(b.eventDate), today);
      // urgent: overdue final balance, OR within 14 days with balance, OR awaiting deposit
      return (
        (outstanding > 0 && days <= 30) ||
        b.status === "deposit_pending" ||
        b.status === "quoted"
      );
    })
    .slice(0, 6);

  return (
    <div className="space-y-12 max-w-7xl">
      <PageHeader
        eyebrow="Studio · Today"
        title={
          <>
            Good morning,{" "}
            <span className="italic font-light">Olive.</span>
          </>
        }
        description={
          <>
            {snapshot.upcoming30} bookings in the next 30 days · {todos.length} items need attention.
          </>
        }
        actions={
          <>
            <Link href="/admin/enquiries" className="btn btn-secondary !py-3">
              <Bell className="h-3.5 w-3.5" strokeWidth={1.5} />
              Inbox
            </Link>
            <Link href="/admin/bookings" className="btn !py-3">
              All bookings
            </Link>
          </>
        }
      />

      {/* KPI strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Bookings — next 30 days"
          value={String(snapshot.upcoming30)}
          icon={Package}
          href="/admin/bookings"
        />
        <StatCard
          label="Revenue — month to date"
          value={formatMoney(snapshot.monthRevenueCents)}
          icon={Wallet}
          href="/admin/finance"
        />
        <StatCard
          label="Outstanding balances"
          value={formatMoney(snapshot.outstandingCents)}
          icon={Wallet}
          href="/admin/finance"
          tone={snapshot.outstandingCents > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Low-stock SKUs"
          value={String(snapshot.lowStockCount)}
          icon={CircleAlert}
          href="/admin/inventory"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today / week */}
        <div className="card p-7 lg:col-span-2">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-2xl text-olive-900">Today &amp; this week</h2>
            <Link href="/admin/calendar" className="text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 inline-flex items-center gap-1">
              Calendar <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
          <ul className="divide-y divide-[color:var(--color-rule-soft)]">
            {bookings.slice(0, 4).map((b) => {
              const days = differenceInCalendarDays(parseISO(b.deliveryDate), today);
              const label =
                days === 0 ? "Today" : days === 1 ? "Tomorrow" : days < 0 ? `${-days}d ago` : `In ${days}d`;
              return (
                <li key={b.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-3 text-olive-800">
                    <Truck className="h-4 w-4 text-olive-500" strokeWidth={1.5} />
                    Delivery — {b.reference} ({b.deliveryAddress ?? "—"})
                  </span>
                  <span className="tabular text-olive-600">{label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Todos */}
        <div className="card p-7">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-2xl text-olive-900">Needs attention</h2>
            <span className="text-[12px] tabular text-olive-500">{todos.length}</span>
          </div>
          <ul className="space-y-4">
            {todos.length === 0 ? (
              <li className="font-display italic text-olive-600 leading-snug">All clear. Quietly impressive.</li>
            ) : (
              todos.map((b) => {
                const days = differenceInCalendarDays(parseISO(b.eventDate), today);
                const outstanding = b.totalCents - b.depositPaidCents - b.finalPaidCents;
                const urgent = (outstanding > 0 && days <= 14) || b.status === "deposit_pending";
                return (
                  <li key={b.id} className="flex items-start gap-3">
                    {urgent ? (
                      <CircleAlert className="h-4 w-4 text-clay-500 mt-0.5 shrink-0" strokeWidth={1.5} />
                    ) : (
                      <span className="block h-4 w-4 mt-1 rounded-full border border-olive-300" />
                    )}
                    <div className="min-w-0">
                      <Link href={`/admin/bookings/${b.id}`} className="text-sm text-olive-800 leading-snug hover:text-clay-500 transition-colors">
                        {b.reference} — {b.clientFullName ?? b.deliveryAddress}
                        {outstanding > 0 && (
                          <span className="text-olive-600"> · {formatMoney(outstanding)} outstanding</span>
                        )}
                      </Link>
                      <p className={`mt-1 text-[11px] uppercase tracking-[0.12em] ${urgent ? "text-clay-600" : "text-olive-500"}`}>
                        {days < 0 ? `${-days}d overdue` : `${days}d to event`}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </section>

      {/* Upcoming bookings */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl text-olive-900">Upcoming bookings</h2>
          <Link href="/admin/bookings" className="text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 inline-flex items-center gap-1">
            All bookings <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-sm tabular">
            <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Ref</th>
                <th className="text-left px-5 py-3 font-medium">Client</th>
                <th className="text-left px-5 py-3 font-medium">Venue</th>
                <th className="text-left px-5 py-3 font-medium">Event</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
              {upcoming.map((b) => (
                <tr key={b.id} className="hover:bg-cream-100/50 transition-colors">
                  <td className="px-5 py-4 text-olive-700">{b.reference}</td>
                  <td className="px-5 py-4 font-display text-olive-900">{b.clientFullName ?? "—"}</td>
                  <td className="px-5 py-4 text-olive-700">{b.deliveryAddress ?? "—"}</td>
                  <td className="px-5 py-4 text-olive-700">{formatDate(b.eventDate, "short")}</td>
                  <td className="px-5 py-4"><StatusBadge kind="booking" value={b.status} /></td>
                  <td className="px-5 py-4 text-right text-olive-800">{formatMoney(b.totalCents)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/bookings/${b.id}`} className="text-olive-700 hover:text-clay-500">
                      <ChevronRight className="h-4 w-4 inline" strokeWidth={1.5} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Day-shaped widgets in a grid for further data */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <DayWidget icon={Calendar} title="This week's events" body={`${bookings.filter((b) => {
          const days = differenceInCalendarDays(parseISO(b.eventDate), today);
          return days >= 0 && days <= 7;
        }).length} events between today and Sunday.`} />
        <DayWidget icon={Truck} title="Pending deliveries" body={`${bookings.filter((b) => b.status === "confirmed" || b.status === "packed").length} bookings ready to dispatch.`} />
        <DayWidget icon={CircleAlert} title="Overdue balances" body={`${bookings.filter((b) => {
          const days = differenceInCalendarDays(parseISO(b.eventDate), today);
          return days <= 30 && (b.totalCents - b.depositPaidCents - b.finalPaidCents) > 0;
        }).length} bookings within the 30-day window with balance owing.`} />
      </section>
    </div>
  );
}

function DayWidget({ icon: Icon, title, body }: { icon: typeof Calendar; title: string; body: string }) {
  return (
    <div className="card p-6">
      <Icon className="h-5 w-5 text-clay-500" strokeWidth={1.5} />
      <p className="eyebrow text-olive-600 mt-4">{title}</p>
      <p className="mt-2 text-sm text-olive-800 leading-relaxed">{body}</p>
    </div>
  );
}
