import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { getVendorContext, getVendorBookings } from "@/services/vendor";
import { supabaseAvailable } from "@/services/_supabase-available";

const navBase: PortalNavItem[] = [
  { label: "Dashboard",     href: "/trade" },
  { label: "Bookings",      href: "/trade/bookings" },
  { label: "Saved details", href: "/trade/preferences" },
  { label: "Spend",         href: "/trade/spend" },
  { label: "Messages",      href: "/trade/messages" },
];

export default async function TradeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getVendorContext();

  // Connected mode: must be a real, approved vendor.
  if (supabaseAvailable()) {
    if (!ctx) redirect("/login?next=/trade");
    if (ctx.status !== "approved") {
      return (
        <div className="min-h-screen bg-canvas grid place-items-center px-6 py-16">
          <div className="max-w-lg text-center">
            <p className="eyebrow text-clay-500 mb-4">{ctx.status === "applied" || ctx.status === "in_review" ? "Application pending" : "Trade access on hold"}</p>
            <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
              {ctx.status === "rejected"
                ? <>We weren't able to approve your application this time.</>
                : ctx.status === "suspended"
                  ? <>Your trade access is currently <span className="italic font-light">paused.</span></>
                  : <>We're <span className="italic font-light">reviewing</span> your application.</>}
            </h1>
            <p className="mt-6 text-olive-700/85 leading-relaxed">
              The studio will be in touch as soon as your tier is set. In the meantime,
              you can still browse the catalogue and book as a regular client.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/" className="btn btn-secondary">Back to home</Link>
              <Link href="/about/contact" className="btn">Talk to the studio</Link>
            </div>
          </div>
        </div>
      );
    }
  }

  const headerStore = await headers();
  const pathname = headerStore.get("x-invoke-path") ?? headerStore.get("next-url") ?? "/trade";

  const bookings = ctx ? await getVendorBookings(ctx.id) : [];
  const liveCount = (bookings as Array<{ status?: string }>).filter(
    (b) => b.status && !["completed", "cancelled", "archived"].includes(b.status),
  ).length;

  const nav = navBase.map((n) =>
    n.href === "/trade/bookings" ? { ...n, count: liveCount } : n,
  );

  return (
    <PortalShell
      title="Trade portal"
      greeting={ctx?.businessName ?? "Trade partner"}
      nav={nav}
      activeHref={pathname}
    >
      {children}
    </PortalShell>
  );
}
