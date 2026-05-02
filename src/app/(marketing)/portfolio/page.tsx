import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
            <span className="italic font-light text-olive-700/85">
              long evenings,
            </span>
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
        meta={
          <span className="tabular">
            {items.length} {items.length === 1 ? "case study" : "case studies"}
          </span>
        }
      />

      <section className="bg-canvas pb-32">
        <div className="shell-wide space-y-24 lg:space-y-32">
          {items.map((item, i) => {
            const flip = i % 2 === 1;
            return (
              <article key={item.slug} data-reveal>
                <Link
                  href={`/portfolio/${item.slug}`}
                  className={`group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-end ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}
                >
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
                    {item.eventDate && (
                      <p className="eyebrow text-olive-600 mb-4 tabular">
                        {formatDate(item.eventDate, "long")}
                      </p>
                    )}
                    <h2 className="font-display text-[clamp(2rem,3vw,2.75rem)] text-olive-900 leading-[1.02] tracking-tight">
                      {item.title}
                    </h2>
                    {item.venue && (
                      <p className="mt-3 text-[12px] uppercase tracking-[0.16em] text-olive-700">
                        {item.venue}
                      </p>
                    )}
                    {item.shortDescription && (
                      <p className="mt-6 text-olive-800/85 leading-relaxed">
                        {item.shortDescription}
                      </p>
                    )}
                    <p className="mt-6 inline-flex items-baseline gap-3 text-[12px] uppercase tracking-[0.16em] text-olive-700 group-hover:text-clay-600 transition-colors">
                      <span className="inline-block w-6 h-px bg-current" />
                      Read the case study
                    </p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
