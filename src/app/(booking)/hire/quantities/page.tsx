import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BookingShell } from "@/components/booking/BookingShell";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { QuantityStepper } from "@/components/booking/QuantityStepper";
import { getDraft } from "@/services/booking-draft";
import { getAvailabilityMap } from "@/services/inventory";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Hire — review your selection" };

export default async function BookingQuantitiesPage() {
  const draft = await getDraft();
  if (!draft.dates) redirect("/hire/dates");
  if (draft.items.length === 0) redirect("/hire/products");

  const availability = await getAvailabilityMap(
    draft.items.map((i) => ({ id: i.productId, slug: i.slug })),
    draft.dates.deliveryDate,
    draft.dates.returnDate,
  );

  return (
    <BookingShell step={3}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <p className="eyebrow mb-4">Step 03 / Review</p>
          <h1 className="font-display text-display-lg text-olive-900 leading-[1] tracking-tight">
            How many of each, <span className="italic font-light">friend?</span>
          </h1>
          <p className="mt-6 text-olive-800/80 text-lg max-w-xl leading-relaxed">
            One last chance to tweak counts. Anything you'd like in the room — add it from the previous step.
          </p>

          <ul className="mt-12 divide-y divide-[color:var(--color-rule-soft)] border-y border-[color:var(--color-rule-soft)]">
            {draft.items.map((it) => {
              const avail = availability.get(it.productId) ?? it.quantity;
              return (
                <li key={it.productId} className="py-6 grid grid-cols-12 gap-4 items-center">
                  <Link href={`/shop/${it.slug}`} className="col-span-2 frame relative aspect-square">
                    {it.heroImageUrl && (
                      <Image
                        src={it.heroImageUrl}
                        alt={it.name}
                        fill
                        sizes="100px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <div className="col-span-5">
                    <h3 className="font-display text-xl text-olive-900 leading-tight">
                      {it.name}{it.colour && <span className="text-olive-600"> — {it.colour}</span>}
                    </h3>
                    {it.fabric && (
                      <p className="text-[12px] uppercase tracking-[0.12em] text-olive-500 mt-1">
                        {it.fabric}
                      </p>
                    )}
                    <p className="text-[12px] uppercase tracking-[0.12em] text-olive-700 tabular mt-2">
                      {formatMoney(it.unitPriceCents)} × {it.quantity}
                    </p>
                  </div>
                  <div className="col-span-3">
                    <QuantityStepper
                      productId={it.productId}
                      initial={it.quantity}
                      max={Math.max(avail, it.quantity)}
                    />
                  </div>
                  <div className="col-span-2 text-right font-display text-xl text-olive-900 tabular">
                    {formatMoney(it.unitPriceCents * it.quantity)}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4 justify-between">
            <Link href="/hire/products" className="text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500">
              + Add more linen
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-3">
            <Link href="/hire/details" className="btn btn-clay">
              Continue to details
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
            <Link href="/hire/products" className="btn btn-ghost">Back</Link>
          </div>
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-32 self-start">
          <BookingSummary draft={draft} />
        </aside>
      </div>
    </BookingShell>
  );
}
