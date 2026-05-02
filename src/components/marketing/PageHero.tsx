import { cn } from "@/lib/cn";

/**
 * Shared editorial page header — eyebrow with leading rule, large display
 * headline, supporting body. Used across Shop, Portfolio, Hospitality and
 * other top-level pages.
 */
export function PageHero({
  eyebrow,
  title,
  body,
  meta,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  /** Optional small label that prints to the right of the body block on desktop. */
  meta?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <section
      className={cn("bg-canvas pt-12 lg:pt-20 pb-14 lg:pb-20", className)}
    >
      <div
        className={cn("shell-wide", align === "center" ? "text-center" : "")}
        data-reveal
      >
        <p
          className={cn(
            "eyebrow flex items-center gap-3",
            align === "center" && "justify-center",
          )}
        >
          <span className="inline-block h-px w-10 bg-olive-700/40" />
          {eyebrow}
        </p>
        <h1 className="mt-6 font-display text-display-xl text-olive-900 leading-[0.96] tracking-tight max-w-4xl">
          {title}
        </h1>
        {(body || meta) && (
          <div
            className={cn(
              "mt-8 grid gap-8 items-end",
              align === "center" ? "" : "lg:grid-cols-12",
            )}
          >
            {body && (
              <div
                className={cn(
                  "text-lg text-olive-800/80 leading-[1.55] max-w-2xl",
                  align === "center" && "mx-auto",
                  align !== "center" && "lg:col-span-7",
                )}
              >
                {body}
              </div>
            )}
            {meta && (
              <div
                className={cn(
                  "text-[12px] uppercase tracking-[0.16em] text-olive-700",
                  align === "center" ? "" : "lg:col-span-5 lg:text-right",
                )}
              >
                {meta}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
