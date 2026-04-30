import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { getPortfolioItems } from "@/services/portfolio";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Real weddings and events dressed by Olive Linen across Queenstown and Central Otago.",
};

export default async function PortfolioPage() {
  const items = await getPortfolioItems();

  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title={
          <>
            Real weddings,
            <br />
            <span className="italic font-light">long evenings,</span>
            <br />
            and a little linen drama.
          </>
        }
        body={
          <>
            A working archive of the events we've dressed across Queenstown
            and Central Otago. Use it to plan your own — every case study lists
            the venue, photographer and team behind it.
          </>
        }
      />

      <section className="bg-canvas pb-32">
        <div className="shell space-y-20">
          {items.map((item, i) => {
            // Alternate layout — image left/right for editorial rhythm
            const flip = i % 2 === 1;
            return (
              <Link
                key={item.slug}
                href={`/portfolio/${item.slug}`}
                className="group block"
              >
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
                  <div className="lg:col-span-8">
                    <div className="frame aspect-[16/10] relative">
                      {item.coverUrl && (
                        <Image
                          src={item.coverUrl}
                          alt={`${item.title} — ${item.venue ?? "Olive Linen"}`}
                          fill
                          sizes="(min-width: 1024px) 66vw, 100vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-4">
                    <p className="eyebrow text-olive-600 mb-3 tabular">
                      {item.eventDate && formatDate(item.eventDate, "long")}
                    </p>
                    <h2 className="font-display text-display-md text-olive-900 leading-[1] tracking-tight">
                      {item.title}
                    </h2>
                    {item.venue && (
                      <p className="mt-3 text-[13px] uppercase tracking-[0.14em] text-olive-700">
                        {item.venue}
                      </p>
                    )}
                    {item.shortDescription && (
                      <p className="mt-6 text-olive-800/85 leading-relaxed">
                        {item.shortDescription}
                      </p>
                    )}
                    <span className="mt-6 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-olive-700 group-hover:text-clay-500 transition-colors">
                      Read the case study
                      <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-cream-50 py-20 border-t border-[color:var(--color-rule-soft)]">
        <div className="shell-narrow text-center">
          <p className="eyebrow text-clay-500 mb-4">Yours next</p>
          <h2 className="font-display text-display-md text-olive-900 leading-[1.05]">
            Ready to dress <span className="italic font-light">your table?</span>
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/hire" className="btn btn-clay">Start a hire</Link>
            <Link href="/about/contact" className="btn btn-secondary">Talk to the studio</Link>
          </div>
        </div>
      </section>
    </>
  );
}
