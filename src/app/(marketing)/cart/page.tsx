import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";
import {
  getDraft,
  draftDeliveryFeeCents,
  draftDiscountCents,
  draftItemCount,
  draftSubtotalCents,
  draftTotalCents,
} from "@/services/booking-draft";
import { depositDueCents } from "@/services/bookings";
import { getVendorContext } from "@/services/vendor";
import { QuantityStepper } from "@/components/booking/QuantityStepper";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your hire selection.",
};

export default async function CartPage() {
  const draft = await getDraft();
  const vendor = await getVendorContext();
  const discountPct = vendor?.status === "approved" ? vendor.discountPct : 0;

  const subtotal = draftSubtotalCents(draft);
  const discount = draftDiscountCents(draft, discountPct);
  const delivery = draftDeliveryFeeCents(draft);
  const total = draftTotalCents(draft, discountPct);
  const deposit = depositDueCents(total);
  const itemCount = draftItemCount(draft);
  const empty = itemCount === 0;

  // Where to send the user next — pick the first incomplete step.
  const continueHref = !draft.dates
    ? "/hire/dates"
    : draft.items.length === 0
      ? "/hire/products"
      : !draft.details
        ? "/hire/details"
        : "/hire/account";

  return (
    <section className="bg-canvas pt-12 lg:pt-16 pb-28">
      <div className="shell">
        <header
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-end"
          data-reveal
        >
          <div className="lg:col-span-7">
            <p className="eyebrow flex items-center gap-3 mb-5">
              <span className="inline-block h-px w-10 bg-olive-700/40" />
              Cart
            </p>
            <h1 className="font-display text-display-lg text-olive-900 leading-[1.02]">
              {empty ? (
                <>
                  Your cart, <span className="italic font-light">quiet for now.</span>
                </>
              ) : (
                <>
                  Almost there.{" "}
                  <span className="italic font-light text-olive-700/85">
                    {itemCount} {itemCount === 1 ? "piece" : "pieces"} ready.
                  </span>
                </>
              )}
            </h1>
          </div>
          <div className="lg:col-span-5">
            <p className="text-olive-800/80 leading-relaxed max-w-md">
              {empty
                ? "Pick your dates first — we'll show you what's available, and you can build the table from there."
                : "Step quantities up or down, then continue to delivery details and the 50% deposit."}
            </p>
          </div>
        </header>

        {empty ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {draft.dates && (
                <article className="card p-6 lg:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow text-olive-600 mb-2.5">Event window</p>
                      <p className="font-display text-[clamp(1.25rem,1.6vw,1.5rem)] text-olive-900 leading-tight">
                        {formatDate(draft.dates.eventDate, "long")}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] uppercase tracking-[0.14em] text-olive-600">
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-3 w-3" strokeWidth={1.5} />
                          Delivery {formatDate(draft.dates.deliveryDate, "short")}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-3 w-3" strokeWidth={1.5} />
                          Return {formatDate(draft.dates.returnDate, "short")}
                        </span>
                        {draft.dates.region && (
                          <span className="inline-flex items-center gap-2 capitalize">
                            <MapPin className="h-3 w-3" strokeWidth={1.5} />
                            {draft.dates.region.replace(/-/g, " ")}
                          </span>
                        )}
                      </p>
                    </div>
                    <Link
                      href="/hire/dates"
                      className="text-[11px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors whitespace-nowrap"
                    >
                      Edit dates
                    </Link>
                  </div>
                </article>
              )}

              <article className="card p-2 lg:p-2">
                <header className="flex items-baseline justify-between px-5 pt-5 pb-3 border-b border-[color:var(--border-hairline)]">
                  <p className="eyebrow text-olive-600">Linen</p>
                  <Link
                    href="/hire/products"
                    className="text-[11px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
                  >
                    Add more
                  </Link>
                </header>

                <ul className="divide-y divide-[color:var(--border-hairline)]">
                  {draft.items.map((it) => (
                    <li
                      key={it.productId}
                      className="px-5 py-5 grid grid-cols-12 items-center gap-4"
                    >
                      <Link
                        href={`/shop/${it.slug}`}
                        className="col-span-3 sm:col-span-2 frame relative aspect-square"
                      >
                        {it.heroImageUrl && (
                          <Image
                            src={it.heroImageUrl}
                            alt={it.name}
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                        )}
                      </Link>
                      <div className="col-span-9 sm:col-span-5 min-w-0">
                        <Link href={`/shop/${it.slug}`} className="block group">
                          <p className="font-display text-[clamp(1rem,1.4vw,1.25rem)] text-olive-900 leading-tight truncate group-hover:text-olive-700 transition-colors">
                            {it.name}
                            {it.colour && (
                              <span className="text-olive-600"> — {it.colour}</span>
                            )}
                          </p>
                        </Link>
                        {it.fabric && (
                          <p className="text-[11px] uppercase tracking-[0.12em] text-olive-500 mt-1.5 truncate">
                            {it.fabric}
                          </p>
                        )}
                        <p className="text-[12px] text-olive-700 mt-2 tabular">
                          {formatMoney(it.unitPriceCents)} × {it.quantity}
                        </p>
                      </div>
                      <div className="col-span-7 sm:col-span-3 flex sm:justify-center">
                        <QuantityStepper
                          productId={it.productId}
                          initial={it.quantity}
                          max={Math.max(it.quantity * 2, 999)}
                        />
                      </div>
                      <div className="col-span-5 sm:col-span-2 text-right font-display text-[clamp(1rem,1.4vw,1.25rem)] text-olive-900 tabular">
                        {formatMoney(it.unitPriceCents * it.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>
              </article>

              <p className="text-[12px] text-olive-600 leading-relaxed max-w-xl">
                Items reflect what's available across your event window. To swap
                colours or change dates,{" "}
                <Link href="/hire/dates" className="lnk">edit your dates</Link>{" "}
                or{" "}
                <Link href="/hire/products" className="lnk">return to the catalogue</Link>.
              </p>
            </div>

            <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 self-start">
              <article className="card p-7">
                <p className="eyebrow text-clay-500 mb-5">Summary</p>

                {discount > 0 && vendor && (
                  <div className="-mt-2 mb-5 flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-clay-300/40 bg-clay-50">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-olive-800">
                      {vendor.discountTier ?? "Trade"} applied
                    </p>
                    <p className="text-[12px] tabular text-clay-600">
                      −{discountPct}%
                    </p>
                  </div>
                )}

                <Row label="Subtotal" value={formatMoney(subtotal)} />
                {discount > 0 && (
                  <Row
                    label={`Discount (−${discountPct}%)`}
                    value={`− ${formatMoney(discount)}`}
                    accent="clay"
                  />
                )}
                <Row
                  label="Delivery"
                  value={delivery > 0 ? formatMoney(delivery) : "Quoted"}
                />

                <div className="mt-5 pt-5 border-t border-[color:var(--border-base)] flex items-baseline justify-between">
                  <span className="eyebrow text-olive-700">Total</span>
                  <span className="font-display text-[clamp(1.5rem,2vw,1.875rem)] text-olive-900 tabular">
                    {formatMoney(total)}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="eyebrow text-clay-600">Deposit due (50%)</span>
                  <span className="font-display text-[clamp(1.125rem,1.5vw,1.375rem)] text-clay-600 tabular">
                    {formatMoney(deposit)}
                  </span>
                </div>

                <Link
                  href={continueHref}
                  className="btn btn-lg w-full mt-7"
                >
                  Continue to checkout
                </Link>

                <p className="mt-5 text-[11px] text-olive-600 leading-relaxed">
                  The 50% deposit secures your booking and locks in the dates.
                  Final balance is due 30 days before your event — we'll remind you.
                </p>
              </article>

              <p className="mt-5 text-[11px] uppercase tracking-[0.16em] text-olive-500">
                Secured by Stripe · NZD
              </p>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
      <div className="lg:col-span-7 xl:col-span-8" data-reveal>
        <div className="card p-10 lg:p-14">
          <p className="font-display italic text-olive-700/85 text-[clamp(1.25rem,1.8vw,1.625rem)] leading-snug max-w-lg">
            "Linen is the kind of thing that should be picked late at night,
            in front of an open notebook, while half-listening to dinner."
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-olive-500">
            — The studio, on cart-stalking
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/hire/dates" className="btn btn-lg">
              Start a hire
            </Link>
            <Link href="/shop" className="btn btn-secondary btn-lg">
              Browse the shop
            </Link>
          </div>
        </div>
      </div>

      <aside
        className="lg:col-span-5 xl:col-span-4 space-y-5"
        data-reveal
        data-reveal-delay="1"
      >
        <article className="card p-7">
          <p className="eyebrow text-clay-500 mb-3">How a hire works</p>
          <ol className="space-y-4">
            {[
              {
                step: "01",
                title: "Pick dates",
                body: "Event date, delivery, return — we check live availability.",
              },
              {
                step: "02",
                title: "Choose linen",
                body: "Only what's available across your dates. Quantities update live.",
              },
              {
                step: "03",
                title: "50% deposit",
                body: "Locks the booking. Final balance 30 days before the event.",
              },
            ].map((s) => (
              <li key={s.step} className="flex items-start gap-4">
                <span className="font-display italic text-clay-500 text-lg tabular leading-none w-6 mt-0.5">
                  {s.step}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-olive-900 text-lg leading-tight">
                    {s.title}
                  </p>
                  <p className="text-sm text-olive-700/85 leading-relaxed mt-1">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </article>

        <article className="card p-7">
          <p className="eyebrow text-clay-500 mb-3">Looking after retail?</p>
          <p className="text-sm text-olive-800/85 leading-relaxed">
            Retail orders (gift sets, candles, runners) currently route through{" "}
            <Link href="/about/contact" className="lnk">the studio directly</Link>{" "}
            while we wire the shop checkout. We'll come back to you the same day.
          </p>
        </article>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "clay";
}) {
  return (
    <div className="flex items-baseline justify-between text-sm py-1.5">
      <span
        className={
          accent === "clay" ? "eyebrow text-clay-600" : "eyebrow text-olive-600"
        }
      >
        {label}
      </span>
      <span
        className={`tabular ${accent === "clay" ? "text-clay-600" : "text-olive-800"}`}
      >
        {value}
      </span>
    </div>
  );
}
