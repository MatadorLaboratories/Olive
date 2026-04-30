import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { getProducts } from "@/services/catalogue";

const layouts: Array<{ colSpan: string; aspect: string }> = [
  { colSpan: "lg:col-span-4 lg:row-span-2 lg:mt-16", aspect: "aspect-[3/4]" },
  { colSpan: "lg:col-span-5",                         aspect: "aspect-[5/4]" },
  { colSpan: "lg:col-span-3",                         aspect: "aspect-square" },
  { colSpan: "lg:col-span-5",                         aspect: "aspect-[3/4]" },
];

export async function FeaturedProducts() {
  // Pick a curated slice — the first four catalogue items by display_order.
  const products = (await getProducts()).slice(0, 4);

  return (
    <section className="bg-canvas py-24 lg:py-36">
      <div className="shell-wide">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">Featured</p>
            <h2 className="font-display text-display-lg text-olive-900 leading-[1] tracking-tight">
              The pieces we're<br />
              <span className="italic font-light">a little obsessed with.</span>
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.12em] text-olive-800 hover:text-clay-500 transition-colors group"
          >
            View the full collection
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-5 gap-y-12">
          {products.map((p, i) => {
            const layout = layouts[i] ?? layouts[0]!;
            const price =
              typeof p.hirePriceCents === "number"
                ? `Hire ${formatMoney(p.hirePriceCents)}`
                : typeof p.retailPriceCents === "number"
                  ? formatMoney(p.retailPriceCents)
                  : "";
            return (
              <Link
                key={p.id}
                href={`/shop/${p.slug}`}
                className={`group block ${layout.colSpan}`}
              >
                <div className={`frame ${layout.aspect} relative`}>
                  {p.heroImageUrl && (
                    <Image
                      src={p.heroImageUrl}
                      alt={`${p.name} in ${p.colour ?? ""}`}
                      fill
                      sizes="(min-width: 1024px) 30vw, 50vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl text-olive-900 leading-tight">
                      {p.name}{p.colour && <span className="text-olive-600"> — {p.colour}</span>}
                    </h3>
                    {p.fabric && (
                      <p className="text-[12px] uppercase tracking-[0.12em] text-olive-500 mt-1">
                        {p.fabric}
                      </p>
                    )}
                  </div>
                  {price && (
                    <p className="text-[12px] uppercase tracking-[0.12em] text-olive-700 whitespace-nowrap tabular">
                      {price}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
