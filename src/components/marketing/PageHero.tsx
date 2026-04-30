import { cn } from "@/lib/cn";

/**
 * Shared editorial page header — eyebrow, large display headline, supporting line.
 * Used across Shop, Portfolio, Hospitality, About so every page has the same
 * commanding entry without re-implementing the layout.
 */
export function PageHero({
  eyebrow,
  title,
  body,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <section className={cn("bg-canvas pt-20 lg:pt-28 pb-14 lg:pb-20", className)}>
      <div className={cn("shell", align === "center" ? "text-center" : "")}>
        <p className={cn("eyebrow flex items-center gap-3", align === "center" && "justify-center")}>
          <span className="inline-block h-px w-8 bg-olive-700/40" />
          {eyebrow}
        </p>
        <h1 className="mt-6 font-display text-display-xl text-olive-900 leading-[0.96] tracking-tight max-w-4xl">
          {title}
        </h1>
        {body && (
          <div className={cn("mt-8 text-lg text-olive-800/80 leading-relaxed max-w-2xl", align === "center" && "mx-auto")}>
            {body}
          </div>
        )}
      </div>
    </section>
  );
}
