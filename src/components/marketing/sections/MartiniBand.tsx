import Link from "next/link";

/**
 * The brand-line band — the "Like the olive to your martini" signature
 * just before the footer. Type-led, generous breathing room, hairline
 * rules to anchor it.
 */
export function MartiniBand() {
  return (
    <section className="relative bg-canvas py-28 lg:py-40 border-t border-[color:var(--border-hairline)] overflow-hidden">
      <div aria-hidden className="absolute inset-0 grain pointer-events-none" />

      <div className="shell relative">
        <div className="max-w-3xl mx-auto text-center" data-reveal>
          <p className="eyebrow flex items-center justify-center gap-3 text-clay-500/90 mb-8">
            <span className="inline-block h-px w-8 bg-clay-500/40" />
            The brand
            <span className="inline-block h-px w-8 bg-clay-500/40" />
          </p>

          <h2 className="font-display text-display-2xl text-olive-900 leading-[0.94] tracking-[-0.035em]">
            like the
            <br />
            <span className="italic font-light tagline-script text-clay-500">
              olive
            </span>
            <br />
            to your
            <br />
            <span className="italic font-light text-olive-700/85">martini.</span>
          </h2>

          <p className="mt-12 max-w-md mx-auto text-olive-700/85 leading-relaxed">
            A small, considered detail that quietly makes the whole thing feel
            right. That's the brief. That's the brand.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link href="/hire" className="btn btn-lg">
              Hire linen
            </Link>
            <Link href="/about" className="btn btn-secondary btn-lg">
              The Olive story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
