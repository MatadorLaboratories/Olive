"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { primaryNav } from "@/config/site";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/cn";
import { AccountMenu, AccountMenuMobile, type HeaderUser } from "./AccountMenu";

/**
 * Marketing header.
 *
 * Posture: confident, quiet. Wordmark sits modestly top-left. Primary nav
 * floats centre on lg+. Right cluster is a small login/account chip + cart
 * icon + one primary CTA (Book now). Active route is signalled by a
 * hairline rule on the nav item, not by clay colour — clay is reserved for
 * action moments.
 *
 * `user` is forwarded from the server layout. When present, the login link
 * is replaced by the editorial `AccountMenu` (hover/click reveal with
 * role-routed dashboard link + sign-out).
 */
export function Header({
  cartCount = 0,
  user = null,
}: {
  cartCount?: number;
  user?: HeaderUser | null;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
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
        "sticky top-0 z-40 transition-[background,backdrop-filter,border-color] duration-500",
        scrolled
          ? "bg-[color:var(--color-canvas)]/85 backdrop-blur-md border-b border-[color:var(--border-hairline)]"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="shell-wide flex items-center justify-between gap-8 py-4 md:py-5">
        {/* Wordmark */}
        <Link href="/" aria-label="Olive Linen — home" className="text-olive-900 shrink-0">
          <Wordmark className="h-6 w-auto md:h-7" />
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className="hidden lg:flex items-center gap-8 text-[12px] tracking-[0.14em] uppercase"
        >
          {primaryNav.slice(1).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-3 text-olive-800 transition-colors duration-200",
                  "hover:text-olive-900",
                  active && "text-olive-900",
                )}
              >
                {item.label}
                {/* Active rule: olive hairline below, not clay */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 right-0 -bottom-px h-px transition-opacity duration-300",
                    active ? "bg-olive-900 opacity-100" : "bg-transparent opacity-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Utility cluster */}
        <div className="flex items-center gap-3 md:gap-5">
          {user ? (
            <AccountMenu user={user} />
          ) : (
            <Link
              href="/login"
              className="hidden md:inline text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-olive-900 transition-colors"
            >
              Login
            </Link>
          )}

          {/* Cart — icon-only when empty, hairline-pill with count when populated */}
          <Link
            href="/cart"
            aria-label={`Cart (${cartCount} ${cartCount === 1 ? "item" : "items"})`}
            className={cn(
              "relative inline-flex items-center justify-center text-olive-800 transition-colors hover:text-olive-900",
              cartCount > 0
                ? "h-9 px-3 gap-2 rounded-full border border-[color:var(--border-base)] text-[11px] uppercase tracking-[0.14em]"
                : "h-9 w-9",
            )}
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            {cartCount > 0 ? (
              <span className="tabular-nums">{cartCount}</span>
            ) : (
              <span className="sr-only">Cart, empty</span>
            )}
          </Link>

          <Link
            href="/hire"
            className="btn btn-sm hidden md:inline-flex"
          >
            Book now
          </Link>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden h-9 w-9 grid place-items-center rounded-full border border-[color:var(--border-base)] text-olive-800 transition-colors hover:border-olive-700"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={1.5} />
            )}
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
        <div className="shell-wide pb-12 pt-2 border-t border-[color:var(--border-hairline)]">
          {user && (
            <div className="mb-6">
              <AccountMenuMobile user={user} />
            </div>
          )}
          <ul className="divide-y divide-[color:var(--border-hairline)]">
            {primaryNav.slice(1).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-baseline justify-between py-5 group"
                >
                  <span
                    className={cn(
                      "font-display text-[clamp(1.75rem,5vw,2.25rem)]",
                      isActive(item.href) ? "italic font-light text-olive-900" : "text-olive-900",
                    )}
                  >
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="text-[11px] uppercase tracking-[0.14em] text-olive-500 max-w-[55%] text-right">
                      {item.description}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {!user && (
              <Link href="/login" className="btn btn-secondary">Login</Link>
            )}
            <Link
              href="/cart"
              className={cn("btn btn-secondary", user && "col-span-2")}
            >
              Cart{cartCount > 0 && <span className="tabular-nums opacity-70"> ({cartCount})</span>}
            </Link>
          </div>
          <Link href="/hire" className="btn btn-lg mt-3 w-full">
            Book now
          </Link>
        </div>
      </div>
    </header>
  );
}
