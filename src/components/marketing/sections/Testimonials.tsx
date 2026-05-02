import { getTestimonials } from "@/services/cms";

/**
 * Testimonials — dark olive ground for editorial weight. Hairline-divided
 * quote columns. No oversized "Quote" icon, no `01 / 03` numerals.
 */
export async function Testimonials() {
  const testimonials = (await getTestimonials()).slice(0, 3);

  return (
    <section className="relative bg-olive-900 text-cream-100 py-24 lg:py-36 overflow-hidden">
      <div aria-hidden className="absolute inset-0 grain pointer-events-none opacity-40" />

      <div className="shell-wide relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16 items-end">
          <div className="lg:col-span-7" data-reveal>
            <p className="eyebrow flex items-center gap-3 text-clay-300/80 mb-5">
              <span className="inline-block h-px w-10 bg-clay-300/40" />
              Kind words
            </p>
            <h2 className="font-display text-display-lg leading-[1.02] text-cream-100">
              Quietly collected,
              <br />
              <span className="italic font-light text-cream-100/80">
                gratefully kept.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-5" data-reveal data-reveal-delay="1">
            <p className="text-cream-100/65 leading-relaxed max-w-md">
              Three from a working folder of clients, planners and venues we've
              dressed across Aotearoa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12">
          {testimonials.map((t, i) => (
            <figure
              key={t.id}
              className="relative pt-8 border-t border-cream-100/15"
              data-reveal
              data-reveal-delay={String(Math.min(i + 1, 4))}
            >
              <span
                aria-hidden
                className="absolute -top-2 left-0 font-display italic text-clay-300/80 text-3xl leading-none"
              >
                &ldquo;
              </span>
              <blockquote className="font-display text-[clamp(1.25rem,1.8vw,1.5rem)] leading-[1.35] text-cream-100/95 max-w-[36ch]">
                {t.quote}
              </blockquote>
              <figcaption className="mt-7 text-[11px] uppercase tracking-[0.16em] text-cream-100/60">
                <strong className="text-cream-100 font-medium not-italic">
                  {t.attribution}
                </strong>
                {t.role && (
                  <>
                    <br />
                    <span className="text-cream-100/50">{t.role}</span>
                  </>
                )}
                {t.event && <span className="text-cream-100/40"> · {t.event}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
