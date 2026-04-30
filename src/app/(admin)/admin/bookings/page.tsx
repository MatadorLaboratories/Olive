import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterBar } from "@/components/admin/FilterBar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getAllBookings } from "@/services/admin/bookings";
import { formatDate, formatMoney } from "@/lib/format";

const STATUS_OPTIONS = [
  { value: "enquiry",         label: "Enquiry" },
  { value: "quoted",          label: "Quoted" },
  { value: "deposit_pending", label: "Deposit pending" },
  { value: "confirmed",       label: "Confirmed" },
  { value: "final_pending",   label: "Final pending" },
  { value: "final_paid",      label: "Final paid" },
  { value: "completed",       label: "Completed" },
];

const SORT_OPTIONS = [
  { value: "soonest", label: "Event soonest" },
  { value: "newest",  label: "Newest" },
  { value: "value",   label: "Largest value" },
];

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; q?: string }>;
}) {
  const { status, sort, q } = await searchParams;
  const bookings = await getAllBookings({
    status,
    search: q,
    sort: (sort as "soonest" | "newest" | "value" | undefined) ?? "soonest",
  });

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        eyebrow="Bookings"
        title={<>All <span className="italic font-light">bookings.</span></>}
        description={`${bookings.length} ${bookings.length === 1 ? "booking" : "bookings"} matching your filters.`}
        actions={
          <Link href="/admin/bookings/new" className="btn btn-clay !py-3">
            New booking
          </Link>
        }
      />

      <FilterBar
        status={status}
        statusOptions={STATUS_OPTIONS}
        sort={sort ?? "soonest"}
        sortOptions={SORT_OPTIONS}
        search={q}
      />

      {bookings.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="font-display italic text-olive-700 text-2xl">
            No bookings match those filters.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm tabular">
            <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Ref</th>
                <th className="text-left px-5 py-3 font-medium">Client</th>
                <th className="text-left px-5 py-3 font-medium">Event</th>
                <th className="text-left px-5 py-3 font-medium">Venue</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Total</th>
                <th className="text-right px-5 py-3 font-medium">Outstanding</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
              {bookings.map((b) => {
                const outstanding = b.totalCents - b.depositPaidCents - b.finalPaidCents;
                return (
                  <tr key={b.id} className="hover:bg-cream-100/60 transition-colors">
                    <td className="px-5 py-4 text-olive-700">{b.reference}</td>
                    <td className="px-5 py-4 font-display text-olive-900">{b.clientFullName ?? "—"}</td>
                    <td className="px-5 py-4 text-olive-700">{formatDate(b.eventDate, "short")}</td>
                    <td className="px-5 py-4 text-olive-700">{b.deliveryAddress ?? "—"}</td>
                    <td className="px-5 py-4"><StatusBadge kind="booking" value={b.status} /></td>
                    <td className="px-5 py-4 text-right text-olive-800">{formatMoney(b.totalCents)}</td>
                    <td className={`px-5 py-4 text-right ${outstanding > 0 ? "text-clay-600" : "text-olive-500"}`}>
                      {formatMoney(outstanding)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/bookings/${b.id}`} className="text-olive-700 hover:text-clay-500">
                        <ChevronRight className="h-4 w-4 inline" strokeWidth={1.5} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
