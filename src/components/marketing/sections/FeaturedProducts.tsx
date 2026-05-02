import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/format";
import { getProducts } from "@/services/catalogue";

/**
 * Featured products — five-pieces editorial grid.
 *
 * Composition: three on the top row (3-up), two on the bottom row offset
 * to the right with a wider second piece. Reads composed, not random.
 * Each card is type-led — small label, name + colour + price on a hairline.
 */
export async function FeaturedProducts() {
  const products = (await getProducts()).slice(0, 5);

  return (
    <section className="bg-canvas pt-24 lg:pt-36 pb-24 lg:pb-32">
      <div className="shell-wide">
        {/* Section head */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-14 items-end">
          <div className="lg:col-span-7" data-reveal>
            <p className="eyebrow flex items-center gap-3 mb-5">
              <span className="inline-block h-px w-10 bg-olive-700/40" />
              Featured
            </p>
            <h2 className="font-display text-display-lg text-olive-900 leading-[1.02]">
              The pieces we're
              <span className="block italic font-light text-olive-700/85">
                a little obsessed with.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-5 flex lg:justify-end" data-reveal data-reveal-delay="1">
            <Link
              href="/shop"
              className="inline-flex items-baseline gap-3 text-[12px] uppercase tracking-[0.16em] text-olive-800 hover:text-clay-600 transition-colors"
            >
              <span className="inline-block w-6 h-px bg-current" />
              View the full collection
            </Link>
          </div>
        </div>

        {/* Grid — first three full width across 12 cols, then two below */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-5 lg:gap-x-8 gap-y-14">
          {products.map((p, i) => {
            const isHero = i === 0;
            // Composition: hero card spans 6 (taller, more presence) on top row,
            // next two each span 3. Bottom row: card 4 spans 5, card 5 spans 6
            // and offsets by 1 — feels editorial, not symmetrical.
            const colSpan = isHero
              ? "lg:col-span-6"
              : i === 1 || i === 2
                ? "lg:col-span-3"
                : i === 3
                  ? "lg:col-span-5 lg:col-start-2"
                  : "lg:col-span-6";
            const aspect = isHero
              ? "aspect-[5/6]"
              : i === 1 || i === 2
                ? "aspect-[4/5]"
                : i === 3
                  ? "aspect-[5/4]"
                  : "aspect-[5/6]";

            const price =
              typeof p.hirePriceCents === "number"
                ? `Hire from ${formatMoney(p.hirePriceCents)}`
                : typeof p.retailPriceCents === "number"
                  ? formatMoney(p.retailPriceCents)
                  : "";

            return (
              <Link
                key={p.id}
                href={`/shop/${p.slug}`}
                className={`group block ${colSpan}`}
                data-reveal
                data-reveal-delay={String(Math.min(i + 1, 4))}
              >
                <div className={`frame ${aspect} relative`}>
                  {p.heroImageUrl && (
                    <Image
                      src={p.heroImageUrl}
                      alt={`${p.name} in ${p.colour ?? ""}`}
                      fill
                      sizes={isHero ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Caption — type-led, hairline rule above */}
                <div className="mt-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-[clamp(1.15rem,1.5vw,1.4rem)] text-olive-900 leading-tight">
                      {p.name}
                      {p.colour && <span className="text-olive-600"> — {p.colour}</span>}
                    </h3>
                    {price && (
                      <p className="text-[11px] uppercase tracking-[0.14em] text-olive-700 whitespace-nowrap">
                        {price}
                      </p>
                    )}
                  </div>
                  {p.fabric && (
                    <p className="text-[12px] text-olive-500 mt-1.5 leading-snug">
                      {p.fabric}
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
