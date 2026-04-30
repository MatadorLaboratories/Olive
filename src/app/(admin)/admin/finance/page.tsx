import Link from "next/link";
import { Wallet, TrendingUp, AlertCircle, ArrowUpRight, Download } from "lucide-react";
import { differenceInCalendarDays, parseISO, format } from "date-fns";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { getAllBookings } from "@/services/admin/bookings";
import { formatDate, formatMoney } from "@/lib/format";

export default async function AdminFinance() {
  const bookings = await getAllBookings();
  const today = new Date();

  // KPIs
  const monthRevenue = bookings.reduce((s, b) => {
    const created = new Date(b.createdAt);
    if (created.getMonth() === today.getMonth() && created.getFullYear() === today.getFullYear()) {
      return s + b.depositPaidCents + b.finalPaidCents;
    }
    return s;
  }, 0);

  const ytdRevenue = bookings.reduce((s, b) => {
    const created = new Date(b.createdAt);
    if (created.getFullYear() === today.getFullYear()) {
      return s + b.depositPaidCents + b.finalPaidCents;
    }
    return s;
  }, 0);

  const outstanding = bookings.reduce((s, b) => {
    if (["cancelled", "archived"].includes(b.status)) return s;
    return s + Math.max(0, b.totalCents - b.depositPaidCents - b.finalPaidCents);
  }, 0);

  const overdue = bookings.filter((b) => {
    if (["cancelled", "archived"].includes(b.status)) return false;
    const o = b.totalCents - b.depositPaidCents - b.finalPaidCents;
    if (o <= 0) return false;
    if (!b.finalDueDate) return false;
    return parseISO(b.finalDueDate) < today;
  });

  // Revenue by month for the last 6 months
  const months: { key: string; label: string; cents: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = format(d, "yyyy-MM");
    months.push({ key, label: format(d, "MMM"), cents: 0 });
  }
  for (const b of bookings) {
    const k = b.createdAt.slice(0, 7);
    const m = months.find((mm) => mm.key === k);
    if (m) m.cents += b.depositPaidCents + b.finalPaidCents;
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.cents));

  // Outstanding rows
  const outstandingRows = bookings
    .filter((b) => !["cancelled", "archived"].includes(b.status) && (b.totalCents - b.depositPaidCents - b.finalPaidCents) > 0)
    .sort((a, b) => (a.finalDueDate ?? "9999").localeCompare(b.finalDueDate ?? "9999"));

  return (
    <div className="space-y-10 max-w-7xl">
      <PageHeader
        eyebrow="Finance"
        title={<>Money, <span className="italic font-light">in motion.</span></>}
        description="Outstanding balances, deposit/final payments, refunds, and revenue at a glance."
        actions={
          <a
            href={`/api/admin/xero-export?from=${format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd")}&to=${format(today, "yyyy-MM-dd")}`}
            className="btn btn-secondary !py-3"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Export Xero CSV
          </a>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Revenue — month to date" value={formatMoney(monthRevenue)} icon={Wallet} />
        <StatCard label="Revenue — year to date" value={formatMoney(ytdRevenue)} icon={TrendingUp} />
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          icon={Wallet}
          tone={outstanding > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Overdue invoices"
          value={String(overdue.length)}
          icon={AlertCircle}
          tone={overdue.length > 0 ? "warning" : "default"}
        />
      </section>

      {/* Revenue chart — pure CSS bar chart */}
      <section className="card p-7">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl text-olive-900">Revenue · last 6 months</h2>
          <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500 tabular">NZD</p>
        </div>
        <div className="grid grid-cols-6 gap-3 items-end h-44">
          {months.map((m) => (
            <div key={m.key} className="flex flex-col items-center justify-end h-full">
              <div className="relative w-full flex-1 flex flex-col justify-end">
                <div
                  className="bg-olive-900 rounded-t-sm w-full transition-all"
                  style={{ height: `${Math.max(2, (m.cents / maxMonth) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-olive-600">{m.label}</p>
              <p className="text-[10px] text-olive-500 tabular">{formatMoney(m.cents)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Outstanding invoices */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl text-olive-900">Outstanding</h2>
          <Link href="/admin/bookings?status=final_pending" className="text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 inline-flex items-center gap-1">
            All bookings <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
          </Link>
        </div>
        {outstandingRows.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-display italic text-olive-700 text-2xl">All paid up.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm tabular">
              <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Ref</th>
                  <th className="text-left px-5 py-3 font-medium">Client</th>
                  <th className="text-left px-5 py-3 font-medium">Final due</th>
                  <th className="text-right px-5 py-3 font-medium">Outstanding</th>
                  <th className="text-right px-5 py-3 font-medium">Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
                {outstandingRows.map((b) => {
                  const out = b.totalCents - b.depositPaidCents - b.finalPaidCents;
                  const due = b.finalDueDate ? parseISO(b.finalDueDate) : parseISO(b.eventDate);
                  const days = differenceInCalendarDays(due, today);
                  return (
                    <tr key={b.id} className="hover:bg-cream-100/60 transition-colors">
                      <td className="px-5 py-4 text-olive-700">
                        <Link href={`/admin/bookings/${b.id}`} className="hover:text-clay-500">{b.reference}</Link>
                      </td>
                      <td className="px-5 py-4 font-display text-olive-900">{b.clientFullName ?? "—"}</td>
                      <td className="px-5 py-4 text-olive-700">{b.finalDueDate ? formatDate(b.finalDueDate, "short") : "—"}</td>
                      <td className={`px-5 py-4 text-right font-medium ${out > 0 ? "text-clay-600" : "text-olive-700"}`}>
                        {formatMoney(out)}
                      </td>
                      <td className={`px-5 py-4 text-right ${days < 0 ? "text-clay-600" : "text-olive-700"}`}>
                        {days < 0 ? `${-days}d overdue` : `${days}d`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
