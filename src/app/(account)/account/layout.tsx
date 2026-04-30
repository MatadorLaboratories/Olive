import { headers } from "next/headers";
import { PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { getCurrentProfile } from "@/services/auth";
import { getBookingsForCurrentUser } from "@/services/bookings-read";

const navBase: PortalNavItem[] = [
  { label: "Dashboard",     href: "/account" },
  { label: "Bookings",      href: "/account/bookings" },
  { label: "Messages",      href: "/account/messages" },
  { label: "Documents",     href: "/account/documents" },
  { label: "Order history", href: "/account/history" },
  { label: "Settings",      href: "/account/settings" },
];

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [profile, bookings, headerStore] = await Promise.all([
    getCurrentProfile(),
    getBookingsForCurrentUser(),
    headers(),
  ]);

  const pathname = headerStore.get("x-invoke-path") ?? headerStore.get("next-url") ?? "/account";

  // First-name greeting that gracefully falls back through profile → email → demo.
  const fullName: string =
    (profile && (profile as { full_name?: string }).full_name) ?? "";
  const fallbackName = bookings[0]?.clientFullName ?? "friend";
  const firstName = (fullName || fallbackName).split(" ")[0] ?? "friend";

  // Active bookings → show count.
  const activeCount = bookings.filter(
    (b) => !["completed", "cancelled", "archived"].includes(b.status),
  ).length;

  const nav = navBase.map((n) =>
    n.href === "/account/bookings" ? { ...n, count: activeCount } : n,
  );

  return (
    <PortalShell
      title="Client portal"
      greeting={`Welcome, ${firstName}`}
      nav={nav}
      activeHref={pathname}
    >
      {children}
    </PortalShell>
  );
}
