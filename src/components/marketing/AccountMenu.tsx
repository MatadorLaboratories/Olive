"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, Sparkles, User2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/types/domain";

export type HeaderUser = {
  fullName: string | null;
  email: string | null;
  role: UserRole | null;
};

/**
 * Account chip + reveal panel for the marketing header.
 *
 * Posture: deliberately quiet. The chip shows just the first name in the
 * uppercase-tracked utility size; hover (desktop) or tap (mobile) opens an
 * editorial card with a customer-portal "Dashboard" link, an optional
 * "Admin" link for staff/admin profiles, and a real sign-out form. No
 * SaaS chevron, no avatar disc — restraint is the point.
 *
 * The customer portal entry is always visible — even admins live as
 * customers some of the time. The Admin entry only renders for admin or
 * staff profiles, sitting above Sign out so it reads as an elevated
 * surface, not a primary action.
 */
export function AccountMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Click-outside closes the panel.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const display = displayName(user);
  const subtitle = user.email ?? roleLabel(user.role);
  const showAdmin = isStudio(user.role);

  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative hidden md:block"
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em]",
          "text-olive-700 hover:text-olive-900 transition-colors",
        )}
      >
        <User2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        <span className="font-display italic font-light text-[13px] tracking-normal text-olive-900 normal-case">
          {display.split(" ")[0]}
        </span>
      </button>

      {/* Reveal panel */}
      <div
        className={cn(
          "absolute right-0 top-full pt-3 w-[18rem] origin-top-right z-50",
          "transition-[opacity,transform] duration-200",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none",
        )}
      >
        <div className="rounded-md border border-[color:var(--border-base)] bg-[color:var(--color-paper)] shadow-soft overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-[color:var(--border-hairline)]">
            <p className="font-display text-xl text-olive-900 leading-tight italic font-light">
              {display}
            </p>
            {subtitle && (
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-olive-500 truncate">
                {subtitle}
              </p>
            )}
          </div>

          <ul>
            <li>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 px-5 py-3.5 text-[12px] uppercase tracking-[0.16em] text-olive-800 hover:bg-cream-50 transition-colors"
              >
                <span>Dashboard</span>
                <span aria-hidden className="text-clay-500">→</span>
              </Link>
            </li>
            {showAdmin && (
              <li className="border-t border-[color:var(--border-hairline)]">
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 text-[12px] uppercase tracking-[0.16em] text-olive-800 hover:bg-cream-50 transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles
                      className="h-3.5 w-3.5 text-clay-500"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    Admin
                  </span>
                  <span aria-hidden className="text-clay-500">→</span>
                </Link>
              </li>
            )}
            <li className="border-t border-[color:var(--border-hairline)]">
              <form method="post" action="/api/auth/sign-out">
                <button
                  type="submit"
                  className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:bg-cream-50 hover:text-clay-600 transition-colors"
                >
                  <span>Sign out</span>
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                </button>
              </form>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile-drawer variant. Renders inline (no popover); same actions, but laid
 * out as a stacked block at the top of the drawer so the user lands on
 * "Dashboard / Admin (if applicable) / Sign out" when they open the menu
 * while logged in.
 */
export function AccountMenuMobile({ user }: { user: HeaderUser }) {
  const display = displayName(user);
  const showAdmin = isStudio(user.role);

  return (
    <div className="rounded-md border border-[color:var(--border-base)] bg-[color:var(--color-paper)] overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-[color:var(--border-hairline)]">
        <p className="eyebrow text-clay-500 mb-1">Signed in</p>
        <p className="font-display text-2xl text-olive-900 italic font-light leading-tight">
          {display}
        </p>
        {user.email && (
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-olive-500 truncate">
            {user.email}
          </p>
        )}
      </div>
      <ul className="divide-y divide-[color:var(--border-hairline)]">
        <li>
          <Link
            href="/account"
            className="flex items-center justify-between px-5 py-4 text-[12px] uppercase tracking-[0.16em] text-olive-800 hover:bg-cream-50 transition-colors"
          >
            <span>Dashboard</span>
            <span aria-hidden className="text-clay-500">→</span>
          </Link>
        </li>
        {showAdmin && (
          <li>
            <Link
              href="/admin"
              className="flex items-center justify-between px-5 py-4 text-[12px] uppercase tracking-[0.16em] text-olive-800 hover:bg-cream-50 transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles
                  className="h-3.5 w-3.5 text-clay-500"
                  strokeWidth={1.5}
                  aria-hidden
                />
                Admin
              </span>
              <span aria-hidden className="text-clay-500">→</span>
            </Link>
          </li>
        )}
        <li>
          <form method="post" action="/api/auth/sign-out">
            <button
              type="submit"
              className="w-full flex items-center justify-between px-5 py-4 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:bg-cream-50 hover:text-clay-600 transition-colors"
            >
              <span>Sign out</span>
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}

// ---------- helpers ----------

/**
 * "Studio" roles get the Admin entry. Vendors are intentionally excluded —
 * they live in the trade portal, not the studio admin.
 */
function isStudio(role: UserRole | null): boolean {
  return role === "admin" || role === "staff";
}

function roleLabel(role: UserRole | null): string {
  switch (role) {
    case "admin":
      return "Studio · admin";
    case "staff":
      return "Studio";
    case "vendor":
      return "Trade";
    default:
      return "Client";
  }
}

function displayName(user: HeaderUser): string {
  if (user.fullName && user.fullName.trim().length > 0) return user.fullName.trim();
  if (user.email) {
    // Use the local part of the email; capitalise the first letter so it
    // reads as a name rather than a slug.
    const local = user.email.split("@")[0] ?? "";
    if (local.length > 0) {
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
  }
  return "Account";
}
