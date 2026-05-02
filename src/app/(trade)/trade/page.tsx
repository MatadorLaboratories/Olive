import Link from "next/link";
import { ArrowUpRight, BadgePercent, Calendar, MessageCircle, Wallet } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { getVendorContext, getVendorBookings } from "@/services/vendor";
import { formatDate, formatMoney } from "@/lib/format";

export default async function TradeDashboard() {
  const ctx = await getVendorContext();
  if (!ctx) return null;

  const rawBookings = await getVendorBookings(ctx.id) as unknown as Array<{
    id?: string; reference?: string; status?: string;
    eventDate?: string; event_date?: string;
    deliveryAddress?: string | null; delivery_address?: string | null;
    totalCents?: number; total_cents?: number;
    depositPaidCents?: number; deposit_paid_cents?: number;
    finalPaidCents?: number; final_paid_cents?: number;
  }>;

  const live = rawBookings.filter((b) => !["completed", "cancelled", "archived"].includes(b.status ?? ""));
  const ytdSpend = rawBookings.reduce(
    (s, b) => s + ((b.depositPaidCents ?? b.deposit_paid_cents) ?? 0) + ((b.finalPaidCents ?? b.final_paid_cents) ?? 0),
    0,
  );
  const outstanding = rawBookings.reduce((s, b) => {
    const total = b.totalCents ?? b.total_cents ?? 0;
    const dep = b.depositPaidCents ?? b.deposit_paid_cents ?? 0;
    const fin = b.finalPaidCents ?? b.final_paid_cents ?? 0;
    if (["cancelled", "archived"].includes(b.status ?? "")) return s;
    return s + Math.max(0, total - dep - fin);
  }, 0);

  const nextEvent = live[0];
  const nextDate = nextEvent ? (nextEvent.eventDate ?? nextEvent.event_date ?? null) : null;
  const daysUntil = nextDate ? differenceInCalendarDays(parseISO(nextDate), new Date()) : null;

  return (
    <div className="space-y-12">
      <header>
        <p className="eyebrow mb-3">Trade studio</p>
        <h1 className="font-display text-display-lg text-olive-900 leading-[1]">
          Welcome back, <span className="italic font-light">{ctx.contactName.split(" ")[0]}.</span>
        </h1>
        <p className="mt-4 text-olive-800/80 text-lg max-w-xl">
          {live.length} live booking{live.length === 1 ? "" : "s"} · {ctx.discountTier ?? "Standard"} pricing applied at checkout.
          {daysUntil !== null && nextEvent && (
            <> Your next event is {daysUntil} days out.</>
          )}
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card label="Live bookings" value={String(live.length)} icon={Calendar} href="/trade/bookings" />
        <Card label="YTD spend" value={formatMoney(ytdSpend)} icon={Wallet} href="/trade/spend" />
        <Card label="Discount tier" value={ctx.discountTier ?? "—"} secondary={`−${ctx.discountPct}%`} icon={BadgePercent} />
        <Card
          label="Outstanding"
          value={formatMoney(outstanding)}
          icon={Wallet}
          href="/trade/bookings"
          tone={outstanding > 0 ? "warning" : "default"}
        />
      </section>

      <section className="card p-7">
        <h2 className="font-display text-2xl text-olive-900 mb-6">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/hire" className="btn">New booking</Link>
          <Link href="/trade/bookings" className="btn btn-secondary">All bookings</Link>
          <Link href="/trade/preferences" className="btn btn-secondary">Saved venues & details</Link>
          <Link href="/trade/messages" className="btn btn-ghost">
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            Message studio
          </Link>
        </div>
      </section>

      {nextEvent && (
        <section className="card p-7">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-2xl text-olive-900">Up next</h2>
            <Link
              href={`/account/bookings/${nextEvent.reference ?? ""}`}
              className="text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 inline-flex items-center gap-1"
            >
              Open booking <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="eyebrow text-olive-500 mb-1">Ref</p>
              <p className="font-display text-xl text-olive-900 tabular">{nextEvent.reference ?? "—"}</p>
            </div>
            <div>
              <p className="eyebrow text-olive-500 mb-1">Event</p>
              <p className="font-display text-xl text-olive-900">
                {nextDate ? formatDate(nextDate, "short") : "—"}
              </p>
            </div>
            <div>
              <p className="eyebrow text-olive-500 mb-1">Venue</p>
              <p className="font-display text-xl text-olive-900 truncate">
                {(nextEvent.deliveryAddress ?? nextEvent.delivery_address) ?? "—"}
              </p>
            </div>
            <div>
              <p className="eyebrow text-olive-500 mb-1">Total</p>
              <p className="font-display text-xl text-olive-900 tabular">
                {formatMoney(nextEvent.totalCents ?? nextEvent.total_cents ?? 0)}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Card({
  label,
  value,
  secondary,
  icon: Icon,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  secondary?: string;
  icon: typeof Calendar;
  href?: string;
  tone?: "default" | "warning";
}) {
  const Wrapper = href ? Link : "div";
  return (
    <Wrapper
      // @ts-expect-error - polymorphic href on conditional element
      href={href}
      className={`card p-6 group transition-colors hover:border-olive-300 ${tone === "warning" ? "border-clay-300/40 bg-clay-50/40" : ""}`}
    >
      <div className="flex items-start justify-between">
        <p className="eyebrow text-olive-600">{label}</p>
        <Icon className="h-4 w-4 text-olive-500" strokeWidth={1.5} />
      </div>
      <p className="mt-5 font-display text-3xl text-olive-900 tabular leading-none">{value}</p>
      {secondary && <p className="mt-3 text-xs text-clay-600 tabular">{secondary}</p>}
    </Wrapper>
  );
}
