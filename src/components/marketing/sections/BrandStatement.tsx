import Image from "next/image";
import { getCmsBlock } from "@/services/cms";

export async function BrandStatement() {
  const block = await getCmsBlock("home.brand_statement");

  return (
    <section className="bg-cream-50 py-24 lg:py-36 border-y border-[color:var(--color-rule-soft)]">
      <div className="shell-wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-8">{block.eyebrow}</p>
            <h2 className="font-display text-display-lg text-olive-900 leading-[0.98]">
              {block.headlineLines.map((line, i) => (
                <span key={i} className={i === 1 ? "block italic font-light text-olive-700/85" : "block"}>
                  {line}
                </span>
              ))}
            </h2>
            <p className="mt-10 max-w-xl text-lg text-olive-800/85 leading-relaxed">
              {block.body}
            </p>

            <dl className="mt-12 grid grid-cols-2 gap-y-6 gap-x-10 max-w-xl">
              {block.stats.map((s) => (
                <div key={s.label} className="border-t border-[color:var(--color-rule)] pt-4">
                  <dt className="eyebrow text-olive-600 mb-1">{s.label}</dt>
                  <dd className="font-display text-2xl text-olive-900 tabular">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="grid grid-cols-2 gap-4">
              {block.images.slice(0, 2).map((src, i) => (
                <div key={src} className={`frame aspect-[3/4] ${i === 0 ? "mt-12" : ""}`}>
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
            <p className="mt-8 italic font-display text-olive-700 max-w-xs leading-snug">
              "{block.pullQuote.quote}"
              <span className="block not-italic font-sans text-[11px] uppercase tracking-[0.16em] text-olive-500 mt-3">
                — {block.pullQuote.attribution}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
