import { format } from "date-fns";
import { getVendorBookings, getVendorContext } from "@/services/vendor";
import { formatMoney } from "@/lib/format";

export default async function TradeSpend() {
  const ctx = await getVendorContext();
  if (!ctx) return null;
  const rows = await getVendorBookings(ctx.id) as unknown as Array<{
    eventDate?: string; event_date?: string;
    depositPaidCents?: number; deposit_paid_cents?: number;
    finalPaidCents?: number; final_paid_cents?: number;
    totalCents?: number; total_cents?: number;
    reference?: string;
    deliveryAddress?: string | null; delivery_address?: string | null;
    clientFullName?: string | null; client_full_name?: string | null;
  }>;

  const today = new Date();
  const months: { key: string; label: string; cents: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM yyyy"), cents: 0 });
  }
  for (const b of rows) {
    const d = b.eventDate ?? b.event_date;
    if (!d) continue;
    const k = d.slice(0, 7);
    const m = months.find((x) => x.key === k);
    if (m) m.cents += (b.depositPaidCents ?? b.deposit_paid_cents ?? 0) + (b.finalPaidCents ?? b.final_paid_cents ?? 0);
  }
  const ytdSpend = rows.reduce(
    (s, b) => s + ((b.depositPaidCents ?? b.deposit_paid_cents) ?? 0) + ((b.finalPaidCents ?? b.final_paid_cents) ?? 0),
    0,
  );
  const max = Math.max(1, ...months.map((m) => m.cents));

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow mb-3">Spend</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Year-to-date,{" "}
          <span className="italic font-light tabular">{formatMoney(ytdSpend)}.</span>
        </h1>
        <p className="mt-3 text-olive-700/85 max-w-xl">
          With your {ctx.discountTier ?? "standard"} tier (−{ctx.discountPct}%) applied at checkout.
        </p>
      </header>

      <section className="card p-7">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl text-olive-900">Last six months</h2>
        </div>
        <div className="grid grid-cols-6 gap-3 items-end h-44">
          {months.map((m) => (
            <div key={m.key} className="flex flex-col items-center justify-end h-full">
              <div className="relative w-full flex-1 flex flex-col justify-end">
                <div
                  className="bg-clay-500 rounded-t-sm w-full transition-all"
                  style={{ height: `${Math.max(2, (m.cents / max) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-olive-600">{m.label.slice(0, 3)}</p>
              <p className="text-[10px] text-olive-500 tabular">{formatMoney(m.cents)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-olive-900 mb-4">Statement</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm tabular">
            <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Ref</th>
                <th className="text-left px-5 py-3 font-medium">Event</th>
                <th className="text-left px-5 py-3 font-medium">Client / venue</th>
                <th className="text-right px-5 py-3 font-medium">Total</th>
                <th className="text-right px-5 py-3 font-medium">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
              {rows.map((b, i) => {
                const paid = (b.depositPaidCents ?? b.deposit_paid_cents ?? 0) + (b.finalPaidCents ?? b.final_paid_cents ?? 0);
                const total = b.totalCents ?? b.total_cents ?? 0;
                return (
                  <tr key={b.reference ?? i}>
                    <td className="px-5 py-4 text-olive-700">{b.reference ?? "—"}</td>
                    <td className="px-5 py-4 text-olive-700">
                      {(b.eventDate ?? b.event_date)?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-5 py-4 font-display text-olive-900">
                      {b.clientFullName ?? b.client_full_name ?? b.deliveryAddress ?? b.delivery_address ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right text-olive-800">{formatMoney(total)}</td>
                    <td className="px-5 py-4 text-right text-olive-700">{formatMoney(paid)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-olive-500">
          Need a tax invoice for your accountant? Email the studio — we'll send it the same day.
        </p>
      </section>
    </div>
  );
}
