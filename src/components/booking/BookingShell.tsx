import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/cn";

/**
 * Booking-flow shell — sticky header + step ribbon. The ribbon uses a
 * connected-rule treatment instead of pill chips: each step is a number
 * + label sitting on a hairline, with the active step in olive-900 and
 * a longer rule beneath it. Reads composed, not gamified.
 */

const steps = [
  { n: 1, label: "Dates" },
  { n: 2, label: "Linen" },
  { n: 3, label: "Quantities" },
  { n: 4, label: "Details" },
  { n: 5, label: "Account" },
  { n: 6, label: "Deposit" },
] as const;

export function BookingShell({
  step,
  children,
}: {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 bg-[color:var(--color-canvas)]/90 backdrop-blur-md border-b border-[color:var(--border-hairline)]">
        <div className="shell-wide flex items-center justify-between gap-6 py-4 md:py-5">
          <Link href="/" aria-label="Olive Linen" className="text-olive-900 shrink-0">
            <Wordmark className="h-6 md:h-7 w-auto" />
          </Link>
          <p className="hidden md:block text-[11px] uppercase tracking-[0.18em] text-olive-500">
            Book your hire
          </p>
          <Link
            href="/"
            className="text-[11px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
          >
            Save &amp; exit
          </Link>
        </div>

        {/* Step ribbon — connected, hairline-anchored */}
        <nav aria-label="Booking progress">
          <ol className="shell-wide flex gap-6 md:gap-9 overflow-x-auto pt-3 pb-1 text-[11px] uppercase tracking-[0.16em]">
            {steps.map((s) => {
              const state =
                s.n < step ? "done" : s.n === step ? "active" : "pending";
              return (
                <li key={s.n} className="shrink-0">
                  <span
                    className={cn(
                      "inline-flex flex-col gap-2 pb-2.5 transition-colors duration-300",
                      state === "active"  && "text-olive-900",
                      state === "done"    && "text-olive-700",
                      state === "pending" && "text-olive-400",
                    )}
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="font-display italic tabular text-[13px] leading-none">
                        {String(s.n).padStart(2, "0")}
                      </span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "h-px transition-all duration-300",
                        state === "active"  && "bg-olive-900 w-full",
                        state === "done"    && "bg-olive-700/50 w-full",
                        state === "pending" && "bg-olive-300/50 w-full",
                      )}
                    />
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <main className="shell-wide py-12 lg:py-20">{children}</main>
    </div>
  );
}
