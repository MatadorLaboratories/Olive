import Image from "next/image";
import { getCmsBlock } from "@/services/cms";

/**
 * Brand statement — type-led with a small image cluster on the right and
 * a four-up KPI dl below the body. Sits on the warmer "paper" surface
 * so it reads as a step up from the canvas hero.
 */
export async function BrandStatement() {
  const block = await getCmsBlock("home.brand_statement");

  return (
    <section className="bg-[color:var(--color-paper)] py-24 lg:py-36 border-y border-[color:var(--border-hairline)]">
      <div className="shell-wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7" data-reveal>
            <p className="eyebrow flex items-center gap-3 mb-7">
              <span className="inline-block h-px w-10 bg-olive-700/40" />
              {block.eyebrow}
            </p>
            <h2 className="font-display text-display-lg text-olive-900 leading-[1.02]">
              {block.headlineLines.map((line, i) => (
                <span
                  key={i}
                  className={
                    i === 1
                      ? "block italic font-light text-olive-700/85"
                      : "block"
                  }
                >
                  {line}
                </span>
              ))}
            </h2>
            <p className="mt-10 max-w-xl text-lg text-olive-800/85 leading-[1.55]">
              {block.body}
            </p>

            <dl className="mt-14 grid grid-cols-2 gap-y-7 gap-x-10 max-w-xl">
              {block.stats.map((s, i) => (
                <div
                  key={s.label}
                  className="border-t border-[color:var(--border-base)] pt-4"
                  data-reveal
                  data-reveal-delay={String(Math.min(i + 1, 4))}
                >
                  <dt className="eyebrow text-olive-600 mb-1.5">{s.label}</dt>
                  <dd className="font-display text-[clamp(1.5rem,1.8vw,1.875rem)] text-olive-900 tabular">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5 relative" data-reveal data-reveal-delay="2">
            <div className="grid grid-cols-2 gap-4">
              {block.images.slice(0, 2).map((src, i) => (
                <div
                  key={src + i}
                  className={`frame aspect-[3/4] ${i === 0 ? "mt-16" : "mt-2"}`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, 45vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <figure className="mt-10">
              <blockquote className="italic font-display text-olive-700 text-[1.0625rem] leading-snug max-w-sm">
                "{block.pullQuote.quote}"
              </blockquote>
              <figcaption className="mt-3 text-[11px] uppercase tracking-[0.16em] text-olive-500">
                — {block.pullQuote.attribution}
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
