import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/cn";
import { signOut } from "@/services/auth";

export type PortalNavItem = {
  label: string;
  href: string;
  count?: number;
};

/**
 * Shared shell for the client + trade portals.
 *
 * Editorial sidebar nav: hairline-divided list, active row marked with a
 * leading clay tick + olive-900 text (no SaaS pill chip).
 */
export function PortalShell({
  title,
  greeting,
  nav,
  activeHref,
  children,
}: {
  title: string;
  greeting: string;
  nav: PortalNavItem[];
  activeHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-[color:var(--border-hairline)] bg-[color:var(--color-canvas)]/85 backdrop-blur-md sticky top-0 z-30">
        <div className="shell-wide flex items-center justify-between gap-6 py-4 md:py-5">
          <Link
            href="/"
            aria-label="Home"
            className="text-olive-900 inline-flex items-center gap-4 shrink-0"
          >
            <Wordmark className="h-6 md:h-7 w-auto" />
            <span className="hidden md:inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-olive-500">
              <span className="inline-block h-px w-5 bg-olive-700/30" />
              {title}
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <p className="text-[12px] text-olive-700 hidden sm:block">
              {greeting}
            </p>
            <form action={signOut}>
              <button
                type="submit"
                className="text-[11px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="shell-wide grid grid-cols-1 lg:grid-cols-12 gap-12 py-12 lg:py-16">
        <aside className="lg:col-span-3">
          <nav aria-label="Portal" className="lg:sticky lg:top-28">
            <ul className="divide-y divide-[color:var(--border-hairline)] border-y border-[color:var(--border-hairline)]">
              {nav.map((item) => {
                const active =
                  activeHref === item.href ||
                  activeHref.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between gap-3 py-3.5 transition-colors",
                        active
                          ? "text-olive-900"
                          : "text-olive-700 hover:text-olive-900",
                      )}
                    >
                      <span className="inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.16em]">
                        <span
                          aria-hidden
                          className={cn(
                            "inline-block h-px transition-all duration-300",
                            active ? "w-6 bg-clay-500" : "w-3 bg-current opacity-40 group-hover:w-5 group-hover:opacity-70",
                          )}
                        />
                        {item.label}
                      </span>
                      {typeof item.count === "number" && (
                        <span
                          className={cn(
                            "text-[11px] tabular",
                            active ? "text-clay-600" : "text-olive-500",
                          )}
                        >
                          {String(item.count).padStart(2, "0")}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className="lg:col-span-9 min-w-0">{children}</main>
      </div>
    </div>
  );
}
