import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/cn";

export type PortalNavItem = {
  label: string;
  href: string;
  count?: number;
};

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
      {/* Top bar */}
      <header className="border-b border-[color:var(--color-rule-soft)] bg-cream-50/80 backdrop-blur-md sticky top-0 z-30">
        <div className="shell-wide flex items-center justify-between gap-6 py-5">
          <Link href="/" aria-label="Home" className="text-olive-900">
            <Wordmark className="h-7 w-auto" />
          </Link>
          <p className="text-[11px] uppercase tracking-[0.16em] text-olive-500 hidden md:block">
            {title}
          </p>
          <div className="flex items-center gap-4">
            <p className="text-[12px] text-olive-700 hidden sm:block">{greeting}</p>
            <Link href="/logout" className="text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500">
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <div className="shell-wide grid grid-cols-1 lg:grid-cols-12 gap-10 py-10 lg:py-16">
        <aside className="lg:col-span-3">
          <nav aria-label="Portal" className="lg:sticky lg:top-28">
            <ul className="space-y-1">
              {nav.map((item) => {
                const active = activeHref === item.href || activeHref.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between gap-3 px-3 py-3 rounded-md transition-colors",
                        active
                          ? "bg-olive-900 text-cream-50"
                          : "text-olive-800 hover:bg-cream-50",
                      )}
                    >
                      <span className="text-[13px] uppercase tracking-[0.12em]">
                        {item.label}
                      </span>
                      {typeof item.count === "number" && (
                        <span
                          className={cn(
                            "text-[11px] tabular px-2 py-0.5 rounded-full border",
                            active
                              ? "border-cream-50/40 text-cream-50"
                              : "border-[color:var(--color-rule)] text-olive-600",
                          )}
                        >
                          {item.count}
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
