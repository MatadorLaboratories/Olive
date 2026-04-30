import Link from "next/link";
import Image from "next/image";
import { BadgePercent, Calendar, MapPin } from "lucide-react";
import {
  draftDeliveryFeeCents,
  draftDiscountCents,
  draftItemCount,
  draftSubtotalCents,
  draftTotalCents,
  type BookingDraft,
} from "@/services/booking-draft";
import { depositDueCents } from "@/services/bookings";
import { getVendorContext } from "@/services/vendor";
import { formatDate, formatMoney } from "@/lib/format";

/**
 * Live booking summary — the sticky aside card on every flow step.
 * Server component — renders from the cookie-stored draft.
 *
 * If the user is a signed-in approved vendor, applies their discount tier
 * automatically. Otherwise no discount.
 */
export async function BookingSummary({
  draft,
  variant = "default",
}: {
  draft: BookingDraft;
  variant?: "default" | "compact";
}) {
  const vendor = await getVendorContext();
  const discountPct = vendor?.status === "approved" ? vendor.discountPct : 0;

  const subtotal = draftSubtotalCents(draft);
  const discount = draftDiscountCents(draft, discountPct);
  const delivery = draftDeliveryFeeCents(draft);
  const total = draftTotalCents(draft, discountPct);
  const deposit = depositDueCents(total);
  const itemCount = draftItemCount(draft);
  const empty = itemCount === 0;

  return (
    <div className="card p-7">
      <p className="eyebrow text-clay-500 mb-4">Your hire</p>

      {/* Trade tier callout */}
      {discountPct > 0 && vendor && (
        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-md border border-clay-300/50 bg-clay-50/40">
          <BadgePercent className="h-3.5 w-3.5 text-clay-500" strokeWidth={1.5} />
          <p className="text-[11px] uppercase tracking-[0.14em] text-olive-800">
            {vendor.discountTier ?? "Trade"} <span className="text-clay-600 tabular">−{discountPct}%</span> applied
          </p>
        </div>
      )}

      {/* Dates */}
      {draft.dates ? (
        <div className="flex items-start gap-3 text-sm text-olive-800 leading-snug">
          <Calendar className="h-4 w-4 mt-0.5 text-olive-500 shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-display text-lg text-olive-900 leading-tight">
              {formatDate(draft.dates.eventDate, "long")}
            </p>
            <p className="text-[12px] uppercase tracking-[0.12em] text-olive-500 mt-1 tabular">
              Delivery {formatDate(draft.dates.deliveryDate, "short")} · Return {formatDate(draft.dates.returnDate, "short")}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm italic text-olive-600">Pick your dates to begin.</p>
      )}

      {draft.dates?.region && (
        <div className="mt-4 flex items-center gap-3 text-sm text-olive-800">
          <MapPin className="h-4 w-4 text-olive-500 shrink-0" strokeWidth={1.5} />
          <span className="capitalize">{draft.dates.region.replace(/-/g, " ")}</span>
        </div>
      )}

      {variant === "default" && draft.items.length > 0 && (
        <ul className="mt-7 space-y-4 border-t border-[color:var(--color-rule-soft)] pt-5">
          {draft.items.map((it) => (
            <li key={it.productId} className="flex items-start gap-3">
              <div className="frame relative h-14 w-12 shrink-0">
                {it.heroImageUrl && (
                  <Image
                    src={it.heroImageUrl}
                    alt={it.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display text-olive-900 leading-tight truncate">
                  {it.name}{it.colour && <span className="text-olive-600"> — {it.colour}</span>}
                </p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-olive-500 mt-1 tabular">
                  {it.quantity} × {formatMoney(it.unitPriceCents)}
                </p>
              </div>
              <p className="text-sm tabular text-olive-800 shrink-0">
                {formatMoney(it.unitPriceCents * it.quantity)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {variant === "compact" && itemCount > 0 && (
        <p className="mt-5 text-sm text-olive-700">
          {itemCount} {itemCount === 1 ? "piece" : "pieces"} across {draft.items.length} {draft.items.length === 1 ? "product" : "products"}
        </p>
      )}

      {!empty ? (
        <div className="mt-7 pt-5 border-t border-[color:var(--color-rule-soft)] space-y-2 text-sm">
          <Row label="Subtotal" value={formatMoney(subtotal)} />
          {discount > 0 && <Row label={`Trade discount (−${discountPct}%)`} value={`− ${formatMoney(discount)}`} accent="clay" />}
          <Row label="Delivery" value={delivery > 0 ? formatMoney(delivery) : "Quoted"} />
          <div className="pt-3 mt-3 border-t border-[color:var(--color-rule-soft)] flex items-baseline justify-between">
            <span className="eyebrow text-olive-700">Total</span>
            <span className="font-display text-2xl text-olive-900 tabular">{formatMoney(total)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="eyebrow text-clay-600">Deposit (50%)</span>
            <span className="font-display text-xl text-clay-600 tabular">{formatMoney(deposit)}</span>
          </div>
        </div>
      ) : (
        draft.dates && (
          <div className="mt-6 text-center">
            <Link href="/hire/products" className="btn btn-secondary !py-3 !text-[12px]">
              Choose your linen
            </Link>
          </div>
        )
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "clay" }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={`eyebrow ${accent === "clay" ? "text-clay-600" : "text-olive-600"}`}>{label}</span>
      <span className={`tabular ${accent === "clay" ? "text-clay-600" : "text-olive-800"}`}>{value}</span>
    </div>
  );
}
