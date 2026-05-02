import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import {
  getProductCategories,
  getProductColours,
  getProducts,
} from "@/services/catalogue";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Take a piece of the studio home. Sets of scallop napkins, runners, candles and post-wedding gifts.",
};

type SearchParams = {
  kind?: string;
  category?: string;
  colour?: string;
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const kindFilter =
    params.kind === "hire" || params.kind === "retail" ? params.kind : undefined;

  const all = await getProducts();
  const filtered = all.filter((p) => {
    if (kindFilter === "hire" && p.kind === "retail") return false;
    if (kindFilter === "retail" && p.kind === "hire") return false;
    if (params.category && p.category !== params.category) return false;
    if (params.colour && p.colour !== params.colour) return false;
    return true;
  });

  const categories = getProductCategories(all);
  const colours = getProductColours(all);

  return (
    <>
      <PageHero
        eyebrow="Shop"
        title={
          <>
            A small{" "}
            <span className="italic font-light text-olive-700/85">
              collection
            </span>{" "}
            for the table.
          </>
        }
        body={
          <>
            The pieces we love most from the studio — scallop napkin sets,
            slow-finished runners, the house candle and post-wedding gift sets.
            Available to hire, to keep, or both.
          </>
        }
        meta={
          <span className="tabular">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
          </span>
        }
      />

      <section className="bg-canvas pb-28">
        <div className="shell-wide grid grid-cols-1 lg:grid-cols-12 gap-12">
          <aside className="lg:col-span-3 lg:sticky lg:top-32 self-start">
            <ShopFilters
              categories={categories}
              colours={colours}
              active={{
                kind: kindFilter,
                category: params.category,
                colour: params.colour,
              }}
            />

            <div className="mt-12 hidden lg:block pt-10 border-t border-[color:var(--border-hairline)]">
              <p className="font-display italic text-olive-700 text-xl leading-snug max-w-[20ch]">
                Looking to dress an event?
              </p>
              <Link
                href="/hire"
                className="mt-5 inline-flex items-baseline gap-3 text-[12px] uppercase tracking-[0.16em] text-olive-800 hover:text-clay-600 transition-colors"
              >
                <span className="inline-block w-6 h-px bg-current" />
                Start a hire
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-9">
            {filtered.length === 0 ? (
              <div className="card p-16 text-center">
                <p className="font-display italic text-olive-700 text-2xl">
                  Nothing in that exact corner.
                </p>
                <p className="mt-3 text-sm text-olive-600">
                  Try clearing a filter, or{" "}
                  <Link href="/about/contact" className="lnk">
                    message the studio
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div
                className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-14"
                data-reveal
              >
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
