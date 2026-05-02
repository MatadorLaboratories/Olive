import Link from "next/link";
import Image from "next/image";
import { getPortfolioItems } from "@/services/portfolio";
import { formatDate } from "@/lib/format";

/**
 * Portfolio preview — anchored hero case study + two stacked secondaries.
 * Composition stays asymmetric but deliberate (hero on the left at 7/12,
 * the two smaller items stacked on the right at 5/12).
 */
export async function PortfolioPreview() {
  const items = (await getPortfolioItems()).slice(0, 3);
  const [hero, second, third] = items;
  if (!hero) return null;

  return (
    <section
      className="bg-canvas py-24 lg:py-36 border-t border-[color:var(--border-hairline)]"
      id="portfolio"
    >
      <div className="shell-wide">
        {/* Section head */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-14 items-end">
          <div className="lg:col-span-7" data-reveal>
            <p className="eyebrow flex items-center gap-3 mb-5">
              <span className="inline-block h-px w-10 bg-olive-700/40" />
              Portfolio
            </p>
            <h2 className="font-display text-display-xl text-olive-900 leading-[0.98]">
              Real weddings,
              <br />
              <span className="italic font-light text-olive-700/85">
                long evenings,
              </span>
              <br />
              and a little linen drama.
            </h2>
          </div>
          <div className="lg:col-span-5" data-reveal data-reveal-delay="1">
            <p className="text-olive-800/80 leading-relaxed max-w-md">
              A working archive of the events we've dressed across Queenstown
              and Central Otago. Use it to plan your own.
            </p>
            <Link
              href="/portfolio"
              className="mt-6 inline-flex items-baseline gap-3 text-[12px] uppercase tracking-[0.16em] text-olive-800 hover:text-clay-600 transition-colors"
            >
              <span className="inline-block w-6 h-px bg-current" />
              Open the archive
            </Link>
          </div>
        </div>

        {/* Hero + secondaries */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Anchored hero case study */}
          <Link
            href={`/portfolio/${hero.slug}`}
            className="group block lg:col-span-7"
            data-reveal
          >
            <div className="frame aspect-[5/6] lg:aspect-[6/7] relative">
              {hero.coverUrl && (
                <Image
                  src={hero.coverUrl}
                  alt={`${hero.title} — ${hero.venue ?? ""}`}
                  fill
                  sizes="(min-width: 1024px) 56vw, 100vw"
                  className="object-cover"
                />
              )}
            </div>
            <CaptionRow item={hero} />
          </Link>

          {/* Stacked secondaries */}
          <div className="lg:col-span-5 grid grid-rows-2 gap-6 lg:gap-8">
            {[second, third].filter(Boolean).map((it, idx) => (
              <Link
                key={it!.slug}
                href={`/portfolio/${it!.slug}`}
                className="group block"
                data-reveal
                data-reveal-delay={String(idx + 2)}
              >
                <div className="frame aspect-[5/4] relative">
                  {it!.coverUrl && (
                    <Image
                      src={it!.coverUrl}
                      alt={`${it!.title} — ${it!.venue ?? ""}`}
                      fill
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <CaptionRow item={it!} compact />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CaptionRow({
  item,
  compact = false,
}: {
  item: NonNullable<Awaited<ReturnType<typeof getPortfolioItems>>[number]>;
  compact?: boolean;
}) {
  const wrapper = compact
    ? "mt-4 flex items-baseline justify-between gap-4"
    : "mt-5 pt-4 flex items-baseline justify-between gap-4 border-t border-[color:var(--border-hairline)]";
  const title = compact
    ? "font-display text-xl text-olive-900 leading-tight"
    : "font-display text-[clamp(1.5rem,2vw,1.875rem)] text-olive-900 leading-tight";
  return (
    <div className={wrapper}>
      <div>
        <h3 className={title}>{item.title}</h3>
        {item.venue && (
          <p className="text-[12px] uppercase tracking-[0.14em] text-olive-500 mt-1">
            {item.venue}
          </p>
        )}
      </div>
      {item.eventDate && (
        <p className="text-[11px] uppercase tracking-[0.16em] text-olive-600">
          {formatDate(item.eventDate, "short")}
        </p>
      )}
    </div>
  );
}
