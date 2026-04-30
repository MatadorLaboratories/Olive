import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getBookingsForCurrentUser } from "@/services/bookings-read";
import { formatDate } from "@/lib/format";

export default async function AccountMessages() {
  const bookings = await getBookingsForCurrentUser();
  const active = bookings.filter(
    (b) => !["completed", "cancelled", "archived"].includes(b.status),
  );

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow mb-3">Messages</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Talk to the <span className="italic font-light">studio.</span>
        </h1>
        <p className="mt-3 text-olive-700/85 max-w-xl">
          Each booking has its own thread, so context never gets lost.
        </p>
      </header>

      {active.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display italic text-olive-700 text-2xl">
            Start a hire to open a thread.
          </p>
          <Link href="/hire" className="btn btn-clay mt-6">Start a hire</Link>
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--color-rule-soft)] border-y border-[color:var(--color-rule-soft)]">
          {active.map((b) => (
            <li key={b.reference}>
              <Link
                href={`/account/bookings/${b.reference}/messages`}
                className="flex items-baseline justify-between gap-4 py-6 group"
              >
                <div>
                  <p className="font-display text-xl text-olive-900 group-hover:text-clay-500 transition-colors">
                    {b.deliveryAddress ?? b.reference}
                  </p>
                  <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-olive-500">
                    {b.reference} · {formatDate(b.eventDate, "long")}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-olive-700 group-hover:text-clay-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
