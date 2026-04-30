import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getPortfolioItemBySlug, getPortfolioItems } from "@/services/portfolio";
import { formatDate } from "@/lib/format";

type Params = { slug: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPortfolioItemBySlug(slug);
  if (!item) return { title: "Not found" };
  return {
    title: `${item.title} — ${item.venue ?? "Portfolio"}`,
    description: item.shortDescription ?? undefined,
    openGraph: {
      images: item.coverUrl ? [{ url: item.coverUrl }] : [],
    },
  };
}

export default async function PortfolioItemPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const item = await getPortfolioItemBySlug(slug);
  if (!item) notFound();

  const allItems = await getPortfolioItems();
  const idx = allItems.findIndex((p) => p.slug === item.slug);
  const next = allItems[(idx + 1) % allItems.length];

  return (
    <>
      <section className="bg-canvas pt-12 lg:pt-16">
        <div className="shell">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
            Back to portfolio
          </Link>
        </div>
      </section>

      {/* Cover */}
      <section className="bg-canvas pt-10 pb-16">
        <div className="shell-wide">
          <div className="frame aspect-[16/9] relative">
            {item.coverUrl && (
              <Image
                src={item.coverUrl}
                alt={`${item.title} — cover`}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </section>

      {/* Title & meta */}
      <section className="bg-canvas pb-12">
        <div className="shell">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7">
              <p className="eyebrow text-olive-600 tabular">
                {item.eventDate && formatDate(item.eventDate, "long")}
              </p>
              <h1 className="mt-4 font-display text-display-xl text-olive-900 leading-[0.96] tracking-tight">
                {item.title}
              </h1>
              {item.venue && (
                <p className="mt-4 text-lg italic font-display text-olive-700">
                  {item.venue}
                </p>
              )}
              {item.bodyMd && (
                <div className="mt-10 max-w-2xl text-olive-800/85 text-lg leading-relaxed whitespace-pre-line">
                  {item.bodyMd}
                </div>
              )}
            </div>
            <aside className="lg:col-span-5 lg:pl-10 lg:border-l lg:border-[color:var(--color-rule)]">
              <p className="eyebrow text-olive-600 mb-4">Credits</p>
              <ul className="space-y-3">
                {item.vendors.map((v) => (
                  <li key={v} className="text-olive-800 leading-snug">{v}</li>
                ))}
              </ul>
              <hr className="my-8" />
              <p className="eyebrow text-clay-500 mb-3">Want this?</p>
              <p className="text-olive-700/85 text-sm leading-relaxed mb-5">
                We can recreate the linen palette of any event in our portfolio.
                Start a hire and tell us which case study inspired you.
              </p>
              <Link href="/hire" className="btn btn-clay !py-3">
                Start a hire
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {item.galleryUrls.length > 0 && (
        <section className="bg-canvas pb-24">
          <div className="shell-wide">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
              {item.galleryUrls.map((src, i) => (
                <div
                  key={src}
                  className={`frame relative ${i % 3 === 0 ? "aspect-[4/5]" : i % 3 === 1 ? "aspect-[3/2]" : "aspect-[5/4]"}`}
                >
                  <Image
                    src={src}
                    alt={`${item.title} — view ${i + 1}`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Next case study */}
      {next && next.slug !== item.slug && (
        <section className="bg-cream-50 py-24 border-t border-[color:var(--color-rule-soft)]">
          <div className="shell">
            <Link href={`/portfolio/${next.slug}`} className="group block">
              <p className="eyebrow text-clay-500 mb-4">Next</p>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-8">
                  <h2 className="font-display text-display-lg text-olive-900 leading-[1] group-hover:text-clay-500 transition-colors">
                    {next.title}
                  </h2>
                  {next.venue && (
                    <p className="mt-3 text-[13px] uppercase tracking-[0.14em] text-olive-700">{next.venue}</p>
                  )}
                </div>
                <div className="lg:col-span-4 flex justify-end">
                  <ArrowUpRight className="h-10 w-10 text-olive-700 group-hover:text-clay-500 transition-colors" strokeWidth={1} />
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
