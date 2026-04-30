import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BookingShell } from "@/components/booking/BookingShell";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { QuantityStepper } from "@/components/booking/QuantityStepper";
import { getDraft } from "@/services/booking-draft";
import { getProducts } from "@/services/catalogue";
import { getAvailabilityMap } from "@/services/inventory";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Hire — choose your linen" };

export default async function BookingProductsPage() {
  const draft = await getDraft();
  if (!draft.dates) redirect("/hire/dates");

  const products = (await getProducts()).filter((p) => p.kind === "hire" || p.kind === "both");
  const availability = await getAvailabilityMap(
    products.map((p) => ({ id: p.id, slug: p.slug })),
    draft.dates.deliveryDate,
    draft.dates.returnDate,
  );

  // Map current draft items by id for fast cross-reference.
  const inDraft = new Map(draft.items.map((i) => [i.productId, i.quantity]));

  return (
    <BookingShell step={2}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <p className="eyebrow mb-4">Step 02 / Linen</p>
          <h1 className="font-display text-display-lg text-olive-900 leading-[1] tracking-tight">
            Choose your <span className="italic font-light">linen.</span>
          </h1>
          <p className="mt-6 text-olive-800/80 text-lg max-w-xl leading-relaxed">
            Quantities below reflect what's available across your dates. Step counts up or down — your booking total updates live to the right.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-12">
            {products.map((p) => {
              const avail = availability.get(p.id) ?? 0;
              const current = inDraft.get(p.id) ?? 0;
              const lowStock = avail > 0 && avail <= 12;
              return (
                <div key={p.id} className="group">
                  <Link href={`/shop/${p.slug}`} className="block frame aspect-[4/5] relative">
                    {p.heroImageUrl && (
                      <Image
                        src={p.heroImageUrl}
                        alt={`${p.name} in ${p.colour ?? ""}`}
                        fill
                        sizes="(min-width: 1024px) 33vw, 50vw"
                        className="object-cover"
                      />
                    )}
                    {avail === 0 && (
                      <div className="absolute inset-0 grid place-items-center bg-olive-950/65 text-cream-50">
                        <span className="pill !border-cream-50/40 !text-cream-50">Booked out for these dates</span>
                      </div>
                    )}
                    {lowStock && avail > 0 && (
                      <span className="absolute top-3 left-3 pill !border-clay-300/80 !text-clay-50 !bg-clay-500/85 backdrop-blur-sm">
                        Only {avail} left
                      </span>
                    )}
                  </Link>

                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl text-olive-900 leading-tight">
                        {p.name}
                        {p.colour && <span className="text-olive-600"> — {p.colour}</span>}
                      </h3>
                      {p.fabric && (
                        <p className="text-[12px] uppercase tracking-[0.12em] text-olive-500 mt-1 truncate">
                          {p.fabric}
                        </p>
                      )}
                    </div>
                    {typeof p.hirePriceCents === "number" && (
                      <p className="text-[12px] uppercase tracking-[0.12em] text-olive-700 whitespace-nowrap tabular">
                        {formatMoney(p.hirePriceCents)} <span className="text-olive-500">/ ea</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <QuantityStepper
                      productId={p.id}
                      initial={current}
                      max={avail}
                    />
                    <p className="text-[11px] uppercase tracking-[0.12em] text-olive-500 tabular">
                      {avail > 0 ? `${avail} available` : "Unavailable"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-14 flex items-center gap-3">
            <Link
              href="/hire/quantities"
              className={`btn btn-clay ${draft.items.length === 0 ? "opacity-40 pointer-events-none" : ""}`}
              aria-disabled={draft.items.length === 0}
            >
              Continue to review
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
            <Link href="/hire/dates" className="btn btn-ghost">Back</Link>
          </div>
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-32 self-start">
          <BookingSummary draft={draft} variant="compact" />
        </aside>
      </div>
    </BookingShell>
  );
}
