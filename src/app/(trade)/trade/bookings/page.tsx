import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getVendorBookings, getVendorContext } from "@/services/vendor";
import { formatDate, formatMoney } from "@/lib/format";

export default async function TradeBookings() {
  const ctx = await getVendorContext();
  if (!ctx) return null;

  const rows = await getVendorBookings(ctx.id) as unknown as Array<{
    id?: string; reference?: string; status?: string;
    eventDate?: string; event_date?: string;
    deliveryAddress?: string | null; delivery_address?: string | null;
    clientFullName?: string | null; client_full_name?: string | null;
    totalCents?: number; total_cents?: number;
  }>;

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow mb-3">Bookings</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Your <span className="italic font-light">trade events.</span>
        </h1>
      </header>

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display italic text-olive-700 text-2xl">No trade bookings yet.</p>
          <Link href="/hire" className="btn btn-clay mt-6">Book one for a client</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm tabular">
            <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Ref</th>
                <th className="text-left px-5 py-3 font-medium">Event</th>
                <th className="text-left px-5 py-3 font-medium">Client / Venue</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
              {rows.map((b, i) => (
                <tr key={b.id ?? i} className="hover:bg-cream-100/50 transition-colors">
                  <td className="px-5 py-4 text-olive-700">{b.reference ?? "—"}</td>
                  <td className="px-5 py-4 text-olive-700">
                    {b.eventDate
                      ? formatDate(b.eventDate, "short")
                      : b.event_date ? formatDate(b.event_date, "short") : "—"}
                  </td>
                  <td className="px-5 py-4 font-display text-olive-900">
                    {b.clientFullName ?? b.client_full_name ?? b.deliveryAddress ?? b.delivery_address ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="pill border-clay-300 text-clay-700 capitalize">
                      {(b.status ?? "—").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-olive-800">
                    {formatMoney(b.totalCents ?? b.total_cents ?? 0)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/account/bookings/${b.reference ?? ""}`} className="text-olive-700 hover:text-clay-500">
                      <ChevronRight className="h-4 w-4 inline" strokeWidth={1.5} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
