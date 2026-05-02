import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getVendorBookings, getVendorContext } from "@/services/vendor";
import { formatDate } from "@/lib/format";

export default async function TradeMessages() {
  const ctx = await getVendorContext();
  if (!ctx) return null;
  const rows = await getVendorBookings(ctx.id) as unknown as Array<{
    reference?: string; status?: string;
    eventDate?: string; event_date?: string;
    deliveryAddress?: string | null; delivery_address?: string | null;
  }>;
  const live = rows.filter((b) => !["completed", "cancelled", "archived"].includes(b.status ?? ""));

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow mb-3">Messages</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Talk to the <span className="italic font-light">studio.</span>
        </h1>
      </header>

      {live.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display italic text-olive-700 text-2xl">No open conversations.</p>
          <Link href="/hire" className="btn mt-6">Start a hire</Link>
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--color-rule-soft)] border-y border-[color:var(--color-rule-soft)]">
          {live.map((b) => (
            <li key={b.reference}>
              <Link
                href={`/account/bookings/${b.reference}/messages`}
                className="flex items-baseline justify-between gap-4 py-6 group"
              >
                <div>
                  <p className="font-display text-xl text-olive-900 group-hover:text-clay-500 transition-colors">
                    {b.deliveryAddress ?? b.delivery_address ?? b.reference ?? "—"}
                  </p>
                  <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-olive-500">
                    {b.reference ?? "—"} · {b.eventDate ? formatDate(b.eventDate, "long") : (b.event_date ? formatDate(b.event_date, "long") : "—")}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-olive-700 group-hover:text-clay-500" strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
