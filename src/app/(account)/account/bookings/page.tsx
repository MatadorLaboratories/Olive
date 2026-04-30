import Link from "next/link";
import { getBookingsForCurrentUser } from "@/services/bookings-read";
import { formatDate, formatMoney } from "@/lib/format";

export default async function AccountBookings() {
  const bookings = await getBookingsForCurrentUser();

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow mb-3">Bookings</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Your <span className="italic font-light">events.</span>
        </h1>
      </header>

      {bookings.length === 0 ? (
        <div className="rounded-md border border-dashed border-olive-300 bg-cream-50 p-10 text-center">
          <p className="font-display italic text-olive-700 text-2xl">No bookings yet.</p>
          <Link href="/hire" className="btn btn-clay mt-6">Start a new hire</Link>
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--color-rule-soft)]">
          {bookings.map((b) => (
            <li key={b.reference}>
              <Link
                href={`/account/bookings/${b.reference}`}
                className="grid grid-cols-12 items-baseline gap-4 py-6 group hover:bg-cream-50/40 -mx-4 px-4 rounded-md transition-colors"
              >
                <p className="col-span-12 md:col-span-3 font-display text-xl text-olive-900">
                  {b.deliveryAddress ?? "Booking"}
                </p>
                <p className="col-span-6 md:col-span-2 text-sm text-olive-600 tabular">{b.reference}</p>
                <p className="col-span-6 md:col-span-3 text-sm text-olive-700">
                  {formatDate(b.eventDate, "long")}
                </p>
                <p className="col-span-6 md:col-span-2">
                  <span className="pill border-clay-300 text-clay-700 capitalize">
                    {b.status.replace(/_/g, " ")}
                  </span>
                </p>
                <p className="col-span-6 md:col-span-2 text-right font-display text-xl text-olive-900 tabular">
                  {formatMoney(b.totalCents)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md border border-dashed border-olive-300 bg-cream-50 p-10 text-center">
        <p className="font-display italic text-olive-700 text-2xl">Past bookings appear here for re-orders.</p>
        <Link href="/hire" className="btn btn-clay mt-6">Start a new hire</Link>
      </div>
    </div>
  );
}
