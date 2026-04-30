import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getPortfolioItems } from "@/services/portfolio";
import { formatDate } from "@/lib/format";

const layouts: Array<{ span: string; aspect: string }> = [
  { span: "lg:col-span-7 lg:row-span-2", aspect: "aspect-[4/5]" },
  { span: "lg:col-span-5",                aspect: "aspect-[5/4]" },
  { span: "lg:col-span-5",                aspect: "aspect-[5/4]" },
  { span: "lg:col-span-7",                aspect: "aspect-[16/10]" },
];

export async function PortfolioPreview() {
  const items = (await getPortfolioItems()).slice(0, 3);

  return (
    <section className="bg-cream-50 py-24 lg:py-36 border-y border-[color:var(--color-rule-soft)]" id="portfolio">
      <div className="shell-wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-14 items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-4">Portfolio</p>
            <h2 className="font-display text-display-xl text-olive-900 leading-[0.96]">
              Real weddings, <br />
              <span className="italic font-light">long evenings,</span> <br />
              and a little linen drama.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-olive-800/80 leading-relaxed text-lg max-w-md">
              A working archive of the events we've dressed across Queenstown and Central Otago. Use it to plan your own.
            </p>
            <Link
              href="/portfolio"
              className="mt-6 inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.12em] text-olive-800 hover:text-clay-500 transition-colors group"
            >
              Open the archive
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {items.map((it, i) => {
            const layout = layouts[i] ?? layouts[0]!;
            return (
              <Link
                key={it.slug}
                href={`/portfolio/${it.slug}`}
                className={`group block ${layout.span}`}
              >
                <div className={`frame ${layout.aspect}`}>
                  {it.coverUrl && (
                    <Image
                      src={it.coverUrl}
                      alt={`${it.title} — ${it.venue ?? ""}`}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <h3 className="font-display text-2xl text-olive-900 leading-tight">
                      {it.title}
                    </h3>
                    {it.venue && (
                      <p className="text-[12px] uppercase tracking-[0.14em] text-olive-500 mt-1">
                        {it.venue}
                      </p>
                    )}
                  </div>
                  {it.eventDate && (
                    <p className="text-[12px] uppercase tracking-[0.14em] text-olive-600 italic font-display">
                      {formatDate(it.eventDate, "short")}
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
