import { Quote } from "lucide-react";
import { getTestimonials } from "@/services/cms";

export async function Testimonials() {
  const testimonials = (await getTestimonials()).slice(0, 3);

  return (
    <section className="relative bg-olive-900 text-cream-100 py-24 lg:py-36 overflow-hidden">
      <div aria-hidden className="absolute inset-0 grain pointer-events-none opacity-50" />

      <div className="shell-wide relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div>
            <p className="eyebrow text-clay-300/80 mb-4">What people are saying</p>
            <h2 className="font-display text-display-lg leading-[1] text-cream-100">
              Kind words, <br />
              <span className="italic font-light text-cream-100/80">
                quietly collected.
              </span>
            </h2>
          </div>
          <Quote className="h-12 w-12 text-clay-300 -scale-x-100" strokeWidth={1} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {testimonials.map((t, i) => (
            <figure
              key={t.id}
              className="relative pt-10 border-t border-cream-100/15"
            >
              <span
                aria-hidden
                className="absolute -top-3 left-0 font-display text-clay-300 text-5xl leading-none"
              >
                "
              </span>
              <blockquote className="font-display text-2xl leading-[1.25] text-cream-100/95">
                {t.quote}
              </blockquote>
              <figcaption className="mt-8 text-[12px] uppercase tracking-[0.14em] text-cream-100/70">
                <strong className="text-cream-100 font-medium not-italic">
                  {t.attribution}
                </strong>
                {t.role && <><br /><span className="text-cream-100/55">{t.role}</span></>}
                {t.event && <span className="text-cream-100/40"> · {t.event}</span>}
              </figcaption>
              <span className="absolute bottom-0 right-0 text-[11px] tabular text-cream-100/30">
                0{i + 1} / 0{testimonials.length}
              </span>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
