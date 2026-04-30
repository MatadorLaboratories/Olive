import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/cn";

const steps = [
  { n: 1, label: "Dates",       href: "/hire/dates" },
  { n: 2, label: "Linen",       href: "/hire/products" },
  { n: 3, label: "Quantities",  href: "/hire/quantities" },
  { n: 4, label: "Details",     href: "/hire/details" },
  { n: 5, label: "Account",     href: "/hire/account" },
  { n: 6, label: "Deposit",     href: "/hire/deposit" },
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
      <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-md border-b border-[color:var(--color-rule-soft)]">
        <div className="shell-wide flex items-center justify-between gap-6 py-5">
          <Link href="/" aria-label="Olive Linen" className="text-olive-900">
            <Wordmark className="h-7 w-auto" />
          </Link>
          <p className="hidden md:block text-[11px] uppercase tracking-[0.16em] text-olive-500">
            Book your hire
          </p>
          <Link href="/" className="text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 transition-colors">
            Save & exit
          </Link>
        </div>

        {/* Step ribbon */}
        <nav aria-label="Booking progress" className="border-t border-[color:var(--color-rule-soft)]">
          <ol className="shell-wide flex gap-1 md:gap-2 overflow-x-auto py-3 text-[11px] uppercase tracking-[0.14em]">
            {steps.map((s) => {
              const state = s.n < step ? "done" : s.n === step ? "active" : "pending";
              return (
                <li key={s.n} className="shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-2 rounded-full border transition-colors",
                      state === "active" && "bg-olive-900 text-cream-50 border-olive-900",
                      state === "done"   && "border-olive-300 text-olive-700",
                      state === "pending" && "border-[color:var(--color-rule)] text-olive-500",
                    )}
                  >
                    <span className="font-display italic tabular">0{s.n}</span>
                    <span className="hidden sm:inline">{s.label}</span>
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
