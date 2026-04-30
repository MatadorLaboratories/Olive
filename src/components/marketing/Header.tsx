"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { primaryNav, utilityNav } from "@/config/site";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/cn";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-500",
        scrolled
          ? "bg-[color:var(--color-canvas)]/85 backdrop-blur-md border-b border-[color:var(--color-rule-soft)]"
          : "bg-transparent",
      )}
    >
      <div className="shell-wide flex items-center justify-between gap-8 py-5 md:py-6">
        {/* Wordmark — top-left, refined, never oversized */}
        <Link href="/" aria-label="Olive Linen — home" className="text-olive-900 shrink-0">
          <Wordmark className="h-7 w-auto md:h-8" />
        </Link>

        {/* Desktop nav — refined sans-serif, generous letter-spacing */}
        <nav
          aria-label="Primary"
          className="hidden lg:flex items-center gap-9 text-[13px] tracking-[0.08em] uppercase"
        >
          {primaryNav.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative py-2 font-medium text-olive-800 transition-colors hover:text-clay-500",
                isActive(item.href) && "text-clay-500",
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-clay-500" />
              )}
            </Link>
          ))}
        </nav>

        {/* Utility cluster */}
        <div className="flex items-center gap-3 md:gap-5">
          <Link
            href="/login"
            className="hidden md:inline text-[12px] uppercase tracking-[0.12em] text-olive-700 hover:text-clay-500 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative inline-flex items-center gap-1 rounded-full border border-[color:var(--color-rule)] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-olive-800 hover:border-olive-800 transition-colors"
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Cart</span>
            <span className="tabular-nums">(0)</span>
          </Link>
          <Link
            href="/hire"
            className="btn btn-clay hidden md:inline-flex !py-2.5 !px-5 !text-[11px]"
          >
            Book now
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden rounded-full border border-[color:var(--color-rule)] p-2 text-olive-800"
          >
            {mobileOpen ? <X className="h-4 w-4" strokeWidth={1.5} /> : <Menu className="h-4 w-4" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-[max-height,opacity] duration-500",
          mobileOpen ? "max-h-[100vh] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="shell-wide pb-10 pt-4 border-t border-[color:var(--color-rule-soft)]">
          <ul className="divide-y divide-[color:var(--color-rule-soft)]">
            {primaryNav.slice(1).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-baseline justify-between py-5 group"
                >
                  <span
                    className={cn(
                      "font-display text-3xl",
                      isActive(item.href) ? "text-clay-500" : "text-olive-900",
                    )}
                  >
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="text-[11px] uppercase tracking-[0.14em] text-olive-500 max-w-[60%] text-right">
                      {item.description}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {utilityNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="btn btn-secondary !py-3"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/hire" className="btn btn-clay mt-3 w-full !py-4">
            Book now
          </Link>
        </div>
      </div>
    </header>
  );
}
