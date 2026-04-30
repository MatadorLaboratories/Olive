import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { getProductCategories, getProductColours, getProducts } from "@/services/catalogue";

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
  const kindFilter = params.kind === "hire" || params.kind === "retail" ? params.kind : undefined;

  // Pull the full set first so filter pills always reflect the real catalogue,
  // then filter client-side by category/colour for instant pivot UX.
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
            A small <span className="italic font-light">collection</span> for the table.
          </>
        }
        body={
          <>
            The pieces we love most from the studio — scallop napkin sets, slow-finished runners, the house candle and post-wedding gift sets.
            Available to hire, to keep, or both.
          </>
        }
      />

      <section className="bg-canvas pb-28">
        <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Filter rail */}
          <aside className="lg:col-span-3 lg:sticky lg:top-32 self-start">
            <ShopFilters
              categories={categories}
              colours={colours}
              active={{ kind: kindFilter, category: params.category, colour: params.colour }}
            />

            <div className="mt-12 hidden lg:block">
              <p className="font-display italic text-olive-700 text-xl leading-snug max-w-[20ch]">
                Looking to dress an event?
              </p>
              <Link
                href="/hire"
                className="mt-4 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-olive-800 hover:text-clay-500 transition-colors"
              >
                Start a hire
                <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
              </Link>
            </div>
          </aside>

          {/* Grid */}
          <div className="lg:col-span-9">
            <div className="flex items-baseline justify-between mb-6">
              <p className="text-[12px] uppercase tracking-[0.14em] text-olive-600 tabular">
                {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
              </p>
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-md border border-dashed border-olive-300 bg-cream-50 p-16 text-center">
                <p className="font-display italic text-olive-700 text-2xl">
                  Nothing in that exact corner. Try clearing a filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-12">
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
