import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getProductBySlug, getProducts } from "@/services/catalogue";
import { formatMoney } from "@/lib/format";

type Params = { slug: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return {
    title: `${product.name} — ${product.colour ?? ""}`.trim(),
    description: product.shortDescription ?? product.description ?? "",
    openGraph: {
      images: product.heroImageUrl ? [{ url: product.heroImageUrl }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const all = await getProducts();
  const related = all
    .filter((p) => p.id !== product.id && (p.category === product.category || p.colour === product.colour))
    .slice(0, 3);

  const hasHire = typeof product.hirePriceCents === "number";
  const hasRetail = typeof product.retailPriceCents === "number";

  return (
    <>
      <section className="bg-canvas pt-12 lg:pt-16 pb-24">
        <div className="shell">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
            Back to shop
          </Link>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Imagery — sticky on desktop */}
            <div className="lg:col-span-7">
              <div className="frame aspect-[4/5] relative">
                {product.heroImageUrl ? (
                  <Image
                    src={product.heroImageUrl}
                    alt={`${product.name} in ${product.colour ?? ""}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-cream-200 text-olive-500 font-display italic text-2xl px-8 text-center">
                    {product.name}
                    {product.colour && (
                      <span className="block text-base mt-2 not-italic tracking-[0.18em] uppercase text-olive-400">
                        {product.colour}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {product.galleryUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {product.galleryUrls.map((src, i) => (
                    <div key={src} className="frame aspect-square relative">
                      <Image
                        src={src}
                        alt={`${product.name} — view ${i + 2}`}
                        fill
                        sizes="(min-width: 1024px) 20vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detail column */}
            <aside className="lg:col-span-5 lg:sticky lg:top-32 self-start">
              <p className="eyebrow flex items-center gap-3">
                <span className="inline-block h-px w-8 bg-olive-700/40" />
                {prettify(product.category ?? "Linen")}
              </p>
              <h1 className="mt-5 font-display text-display-lg text-olive-900 leading-[1] tracking-tight">
                {product.name}
                {product.colour && (
                  <span className="block italic font-light text-olive-700/85">
                    in {product.colour.toLowerCase()}
                  </span>
                )}
              </h1>

              <dl className="mt-8 grid grid-cols-2 gap-y-4 gap-x-6 max-w-md">
                {product.fabric && (
                  <>
                    <dt className="eyebrow text-olive-600 self-start">Fabric</dt>
                    <dd className="text-olive-800 text-sm">{product.fabric}</dd>
                  </>
                )}
                {product.size && (
                  <>
                    <dt className="eyebrow text-olive-600 self-start">Size</dt>
                    <dd className="text-olive-800 text-sm tabular">{product.size}</dd>
                  </>
                )}
                {hasHire && (
                  <>
                    <dt className="eyebrow text-olive-600 self-start">Hire from</dt>
                    <dd className="font-display text-olive-900 text-2xl tabular leading-none">
                      {formatMoney(product.hirePriceCents!)}
                      <span className="text-[11px] uppercase tracking-[0.12em] text-olive-500 ml-2 font-sans">/ event</span>
                    </dd>
                  </>
                )}
                {hasRetail && (
                  <>
                    <dt className="eyebrow text-olive-600 self-start">Shop</dt>
                    <dd className="font-display text-olive-900 text-2xl tabular leading-none">
                      {formatMoney(product.retailPriceCents!)}
                    </dd>
                  </>
                )}
              </dl>

              {product.description && (
                <p className="mt-10 text-olive-800/85 leading-relaxed text-lg">
                  {product.description}
                </p>
              )}

              <div className="mt-10 flex flex-wrap items-center gap-3">
                {hasHire && (
                  <Link href="/hire/dates" className="btn">
                    Add to hire booking
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </Link>
                )}
                {hasRetail && (
                  <Link href="/cart" className="btn btn-secondary">
                    Add to cart
                  </Link>
                )}
              </div>

              <div className="mt-12 pt-6 border-t border-[color:var(--color-rule)]">
                <p className="eyebrow text-clay-500 mb-3">Care</p>
                <p className="text-sm text-olive-700 leading-relaxed">
                  Every Olive piece is washed in our studio between events. For retail pieces — a cool wash with a low spin, line dry, low iron while still slightly damp.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-cream-50 py-20 border-t border-[color:var(--color-rule-soft)]">
          <div className="shell">
            <div className="flex items-baseline justify-between mb-10">
              <h2 className="font-display text-display-sm text-olive-900">
                You might also like
              </h2>
              <Link
                href="/shop"
                className="text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 transition-colors inline-flex items-center gap-1"
              >
                Browse all
                <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-12">
              {related.map((p) => (
                <Link key={p.id} href={`/shop/${p.slug}`} className="group block">
                  <div className="frame aspect-[4/5] relative">
                    {p.heroImageUrl && (
                      <Image
                        src={p.heroImageUrl}
                        alt={p.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, 50vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-lg text-olive-900">
                    {p.name}{p.colour && <span className="text-olive-600"> — {p.colour}</span>}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function prettify(s: string) {
  return s.replace(/^./, (c) => c.toUpperCase());
}
