"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  CalendarDays,
  Package,
  Boxes,
  MessageCircle,
  Tags,
  Wallet,
  Users,
  Building2,
  Sparkles,
  Inbox,
  BarChart3,
  Pencil,
} from "lucide-react";

const groups = [
  {
    label: "Operate",
    items: [
      { label: "Dashboard", href: "/admin",          icon: LayoutDashboard },
      { label: "Calendar",  href: "/admin/calendar", icon: CalendarDays },
      { label: "Bookings",  href: "/admin/bookings", icon: Package },
      { label: "Messages",  href: "/admin/messages", icon: MessageCircle },
      { label: "Inventory", href: "/admin/inventory", icon: Boxes },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { label: "Products", href: "/admin/products", icon: Tags },
      { label: "Pricing",  href: "/admin/pricing",  icon: Wallet },
      { label: "CMS",      href: "/admin/cms",      icon: Pencil },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Clients",  href: "/admin/clients", icon: Users },
      { label: "Vendors",  href: "/admin/vendors", icon: Building2 },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { label: "Wholesale & custom", href: "/admin/wholesale", icon: Sparkles },
      { label: "Enquiries",          href: "/admin/enquiries", icon: Inbox },
      { label: "Finance",            href: "/admin/finance",   icon: Wallet },
      { label: "Reports",            href: "/admin/reports",   icon: BarChart3 },
    ],
  },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[color:var(--color-paper)] text-olive-900">
      <aside className="fixed inset-y-0 left-0 w-64 bg-olive-950 text-cream-100 hidden lg:flex flex-col">
        <div className="px-6 py-6 border-b border-cream-100/10">
          <Link
            href="/admin"
            className="text-cream-100 inline-block opacity-95 hover:opacity-100 transition-opacity"
          >
            <Wordmark className="h-6 w-auto" />
          </Link>
          <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-cream-100/55">
            Studio · Admin
          </p>
        </div>

        <nav
          aria-label="Admin"
          className="flex-1 overflow-y-auto py-5 px-3 space-y-7"
        >
          {groups.map((g) => (
            <div key={g.label}>
              <p className="px-3 text-[10px] uppercase tracking-[0.22em] text-cream-100/40 mb-2.5">
                {g.label}
              </p>
              <ul className="space-y-px">
                {g.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-[13px]",
                          active
                            ? "bg-cream-100/8 text-cream-50"
                            : "text-cream-100/80 hover:bg-cream-100/5 hover:text-cream-50",
                        )}
                      >
                        {/* Active tick — clay rule on the left */}
                        <span
                          aria-hidden
                          className={cn(
                            "absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-sm transition-colors",
                            active ? "bg-clay-400" : "bg-transparent",
                          )}
                        />
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            active ? "text-clay-300" : "text-cream-100/70",
                          )}
                          strokeWidth={1.5}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-cream-100/10 text-[11px] uppercase tracking-[0.16em] text-cream-100/55 flex items-center gap-3">
          <Link
            href="/"
            className="hover:text-cream-50 transition-colors"
          >
            View public site
          </Link>
          <span aria-hidden className="text-cream-100/25">·</span>
          <form method="post" action="/api/auth/sign-out">
            <button
              type="submit"
              className="hover:text-cream-50 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <main className="px-6 lg:px-10 py-8 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
