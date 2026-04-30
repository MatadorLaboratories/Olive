import Link from "next/link";

/**
 * The brand-line band — places "like the olive to your martini" front-and-centre
 * as the editorial signature moment before the footer.
 */
export function MartiniBand() {
  return (
    <section className="relative bg-canvas py-28 lg:py-40 border-t border-[color:var(--color-rule-soft)] overflow-hidden">
      <div aria-hidden className="absolute inset-0 grain pointer-events-none" />

      {/* Decorative rules — top and bottom hairlines run edge to edge */}
      <div className="shell-wide relative text-center">
        <p className="eyebrow text-clay-500 mb-8">The brand</p>
        <h2 className="font-display text-display-2xl text-olive-900 leading-[0.95] tracking-[-0.04em]">
          like the
          <br />
          <span className="italic font-light tagline-script text-clay-500">olive</span>
          <br />
          to your
          <br />
          <span className="italic font-light text-olive-700/85">martini.</span>
        </h2>

        <p className="mt-12 max-w-md mx-auto text-olive-700/80 leading-relaxed">
          A small, considered detail that quietly makes the whole thing feel right.
          That's the brief. That's the brand.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link href="/about" className="btn btn-secondary">
            The Olive story
          </Link>
          <Link href="/hire" className="btn btn-clay">
            Hire linen
          </Link>
        </div>
      </div>
    </section>
  );
}
