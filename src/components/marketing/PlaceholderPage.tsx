import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * Editorial placeholder for routes whose deep content arrives in later phases.
 * Keeps the brand voice intact rather than dropping users on a blank page.
 */
export function PlaceholderPage({
  eyebrow,
  title,
  body,
  primaryCta = { label: "Back to home", href: "/" },
  secondaryCta,
  phase,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body: React.ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  phase?: string;
}) {
  return (
    <section className="bg-canvas pt-24 pb-32 min-h-[70vh]">
      <div className="shell-narrow">
        <p className="eyebrow flex items-center gap-3">
          <span className="inline-block h-px w-8 bg-olive-700/40" />
          {eyebrow}
        </p>
        <h1 className="mt-6 font-display text-display-xl text-olive-900 leading-[1] tracking-tight">
          {title}
        </h1>
        <div className="mt-8 max-w-xl text-olive-800/80 leading-relaxed text-lg">
          {body}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link href={primaryCta.href} className="btn">
            {primaryCta.label}
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
          {secondaryCta && (
            <Link href={secondaryCta.href} className="btn btn-secondary">
              {secondaryCta.label}
            </Link>
          )}
        </div>

        {phase && (
          <p className="mt-16 text-[11px] uppercase tracking-[0.16em] text-olive-500">
            {phase}
          </p>
        )}
      </div>
    </section>
  );
}
