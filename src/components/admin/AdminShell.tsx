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
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Calendar",  href: "/admin/calendar", icon: CalendarDays },
      { label: "Bookings",  href: "/admin/bookings", icon: Package },
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
      { label: "Clients",  href: "/admin/clients",  icon: Users },
      { label: "Vendors",  href: "/admin/vendors",  icon: Building2 },
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
    <div className="min-h-screen bg-cream-50 text-olive-900">
      <aside className="fixed inset-y-0 left-0 w-64 bg-olive-950 text-cream-100 hidden lg:flex flex-col">
        <div className="px-6 py-6 border-b border-cream-100/10">
          <Link href="/admin" className="text-cream-100">
            <Wordmark className="h-7 w-auto" />
          </Link>
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-cream-100/50">
            Studio · Admin
          </p>
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="px-3 text-[10px] uppercase tracking-[0.2em] text-cream-100/40 mb-2">
                {g.label}
              </p>
              <ul className="space-y-0.5">
                {g.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-[13px]",
                          active
                            ? "bg-clay-500 text-cream-50"
                            : "text-cream-100/85 hover:bg-cream-100/5 hover:text-cream-50",
                        )}
                      >
                        <item.icon className="h-4 w-4" strokeWidth={1.5} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-cream-100/10 text-[11px] text-cream-100/50">
          <Link href="/" className="hover:text-cream-100">View public site</Link>
          <span className="mx-2">·</span>
          <Link href="/logout" className="hover:text-cream-100">Sign out</Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <main className="px-6 lg:px-10 py-8 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
