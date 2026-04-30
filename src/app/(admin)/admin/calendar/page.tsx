import Link from "next/link";
import { ChevronLeft, ChevronRight, Truck, Calendar as CalendarIcon, CreditCard, Sparkles } from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { PageHeader } from "@/components/admin/PageHeader";
import { getAllBookings } from "@/services/admin/bookings";
import { cn } from "@/lib/cn";

type CalendarEvent = {
  date: string; // YYYY-MM-DD
  kind: "event" | "delivery" | "return" | "final-due";
  bookingId: string;
  bookingRef: string;
  label: string;
};

export default async function AdminCalendar({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const cursor = monthParam ? parseISO(`${monthParam}-01`) : new Date();

  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const bookings = await getAllBookings();
  const events: CalendarEvent[] = [];
  for (const b of bookings) {
    if (["cancelled", "archived"].includes(b.status)) continue;
    events.push({ date: b.eventDate, kind: "event", bookingId: b.id, bookingRef: b.reference, label: `${b.clientFullName ?? "—"}` });
    events.push({ date: b.deliveryDate, kind: "delivery", bookingId: b.id, bookingRef: b.reference, label: `Deliver ${b.reference}` });
    events.push({ date: b.returnDate, kind: "return", bookingId: b.id, bookingRef: b.reference, label: `Collect ${b.reference}` });
    if (b.finalDueDate && (b.totalCents - b.depositPaidCents - b.finalPaidCents) > 0) {
      events.push({ date: b.finalDueDate, kind: "final-due", bookingId: b.id, bookingRef: b.reference, label: `Final ${b.reference}` });
    }
  }

  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const arr = eventsByDay.get(e.date) ?? [];
    arr.push(e);
    eventsByDay.set(e.date, arr);
  }

  const prev = format(subMonths(cursor, 1), "yyyy-MM");
  const next = format(addMonths(cursor, 1), "yyyy-MM");

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        eyebrow="Calendar"
        title={
          <>
            {format(cursor, "MMMM")}{" "}
            <span className="italic font-light text-olive-700/85 tabular">{format(cursor, "yyyy")}</span>
          </>
        }
        description="Events, deliveries, collections and final-balance dates."
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/admin/calendar?month=${prev}`} className="btn btn-secondary !py-3 !px-3">
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
            <Link href="/admin/calendar" className="btn btn-secondary !py-3 !text-[12px]">Today</Link>
            <Link href={`/admin/calendar?month=${next}`} className="btn btn-secondary !py-3 !px-3">
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        }
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.14em] text-olive-700">
        <Legend kind="event">Event</Legend>
        <Legend kind="delivery">Delivery</Legend>
        <Legend kind="return">Collection</Legend>
        <Legend kind="final-due">Final due</Legend>
      </div>

      {/* Calendar grid */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 bg-cream-100 text-[10px] uppercase tracking-[0.14em] text-olive-600 border-b border-[color:var(--color-rule-soft)]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-3 py-2 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, cursor);
            const isToday = format(new Date(), "yyyy-MM-dd") === key;
            const dayEvents = eventsByDay.get(key) ?? [];
            return (
              <div
                key={key}
                className={cn(
                  "min-h-[6.5rem] border-b border-r border-[color:var(--color-rule-soft)] p-2 align-top relative",
                  !inMonth && "bg-cream-50/50",
                )}
              >
                <div className={cn(
                  "text-[12px] tabular font-medium",
                  isToday ? "text-clay-500" : inMonth ? "text-olive-800" : "text-olive-300",
                )}>
                  {format(day, "d")}
                </div>
                <ul className="mt-1.5 space-y-1">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <li key={`${e.bookingId}-${e.kind}-${i}`}>
                      <Link
                        href={`/admin/bookings/${e.bookingId}`}
                        className={cn(
                          "block px-1.5 py-1 rounded text-[10px] uppercase tracking-[0.08em] truncate",
                          e.kind === "event" && "bg-olive-900 text-cream-50",
                          e.kind === "delivery" && "bg-clay-500 text-cream-50",
                          e.kind === "return" && "bg-sage-300 text-olive-900",
                          e.kind === "final-due" && "bg-cream-200 text-olive-800 border border-clay-300/60",
                        )}
                      >
                        {e.label}
                      </Link>
                    </li>
                  ))}
                  {dayEvents.length > 3 && (
                    <li className="text-[10px] text-olive-500">+{dayEvents.length - 3} more</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's snapshot */}
      <section className="card p-7">
        <h2 className="font-display text-2xl text-olive-900 mb-6">Today</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <SnapshotCard icon={CalendarIcon} label="Events" count={events.filter((e) => e.kind === "event" && e.date === format(new Date(), "yyyy-MM-dd")).length} />
          <SnapshotCard icon={Truck} label="Deliveries" count={events.filter((e) => e.kind === "delivery" && e.date === format(new Date(), "yyyy-MM-dd")).length} />
          <SnapshotCard icon={Sparkles} label="Collections" count={events.filter((e) => e.kind === "return" && e.date === format(new Date(), "yyyy-MM-dd")).length} />
          <SnapshotCard icon={CreditCard} label="Final due" count={events.filter((e) => e.kind === "final-due" && e.date === format(new Date(), "yyyy-MM-dd")).length} />
        </div>
      </section>
    </div>
  );
}

function Legend({ kind, children }: { kind: CalendarEvent["kind"]; children: React.ReactNode }) {
  const className = cn(
    "inline-block h-2.5 w-2.5 rounded-sm mr-2",
    kind === "event" && "bg-olive-900",
    kind === "delivery" && "bg-clay-500",
    kind === "return" && "bg-sage-300",
    kind === "final-due" && "bg-cream-200 border border-clay-300/60",
  );
  return (
    <span className="inline-flex items-center">
      <span className={className} />{children}
    </span>
  );
}

function SnapshotCard({ icon: Icon, label, count }: { icon: typeof Truck; label: string; count: number }) {
  return (
    <div className="card p-5">
      <Icon className="h-4 w-4 text-clay-500" strokeWidth={1.5} />
      <p className="eyebrow text-olive-600 mt-3">{label}</p>
      <p className="font-display text-3xl text-olive-900 mt-2 tabular">{count}</p>
    </div>
  );
}
