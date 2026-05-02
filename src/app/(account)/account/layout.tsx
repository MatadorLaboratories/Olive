import { headers } from "next/headers";
import { PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { getCurrentProfile } from "@/services/auth";
import { getBookingsForCurrentUser } from "@/services/bookings-read";
import { getCustomOrdersForCurrentUser } from "@/services/custom-orders-read";
import { claimCustomOrdersForCurrentUser } from "@/services/custom-orders-claim";

const navBase: PortalNavItem[] = [
  { label: "Dashboard",     href: "/account" },
  { label: "Bookings",      href: "/account/bookings" },
  { label: "Custom orders", href: "/account/custom-orders" },
  { label: "Messages",      href: "/account/messages" },
  { label: "Documents",     href: "/account/documents" },
  { label: "Order history", href: "/account/history" },
  { label: "Settings",      href: "/account/settings" },
];

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Anonymous-submission handoff: any custom orders submitted before the
  // user had an account are linked here on first authenticated visit. Idem-
  // potent on subsequent renders — cheap once everything is claimed.
  await claimCustomOrdersForCurrentUser();

  const [profile, bookings, customOrders, headerStore] = await Promise.all([
    getCurrentProfile(),
    getBookingsForCurrentUser(),
    getCustomOrdersForCurrentUser(),
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

  // Active custom orders (anything not completed/cancelled).
  const activeCustomCount = customOrders.filter(
    (o) => !["completed", "cancelled"].includes(o.status),
  ).length;

  const nav = navBase.map((n) => {
    if (n.href === "/account/bookings") return { ...n, count: activeCount };
    if (n.href === "/account/custom-orders")
      return { ...n, count: activeCustomCount };
    return n;
  });

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
