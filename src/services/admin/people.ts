import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "../_supabase-available";
import { getAllBookings } from "./bookings";

export type AdminClient = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  bookingCount: number;
  lifetimeSpendCents: number;
  lastEventDate: string | null;
};

export type AdminVendor = {
  id: string;
  businessName: string;
  vendorType: string | null;
  region: string | null;
  status: "applied" | "in_review" | "approved" | "suspended" | "rejected";
  discountPct: number;
  discountTier: string | null;
  contactEmail: string | null;
  contactName: string | null;
  appliedAt: string;
  bookingCount: number;
  spendCents: number;
};

export async function getAdminClients(): Promise<AdminClient[]> {
  if (!supabaseAvailable()) return seedClients;

  const supabase = await createSupabaseServerClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role")
    .eq("role", "client");

  const bookings = await getAllBookings();
  return ((profiles ?? []) as Array<Record<string, unknown>>).map((p) => {
    const own = bookings.filter((b) => b.clientId === String(p.id));
    return {
      id: String(p.id),
      fullName: (p.full_name as string) ?? "—",
      email: (p.email as string | null) ?? null,
      phone: (p.phone as string | null) ?? null,
      bookingCount: own.length,
      lifetimeSpendCents: own.reduce((s, b) => s + b.depositPaidCents + b.finalPaidCents, 0),
      lastEventDate: own[0]?.eventDate ?? null,
    };
  });
}

export async function getAdminVendors(): Promise<AdminVendor[]> {
  if (!supabaseAvailable()) return seedVendors;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("vendor_profiles")
    .select("*, profiles:id(full_name, email, business_name, phone)");
  return ((data ?? []) as Array<Record<string, unknown>>).map((v) => ({
    id: String(v.id),
    businessName:
      (v.profiles as { business_name?: string } | null)?.business_name ??
      (v.profiles as { full_name?: string } | null)?.full_name ?? "—",
    vendorType: (v.vendor_type as string | null) ?? null,
    region: (v.region as string | null) ?? null,
    status: v.status as AdminVendor["status"],
    discountPct: Number(v.discount_pct ?? 0),
    discountTier: (v.discount_tier as string | null) ?? null,
    contactEmail: (v.profiles as { email?: string } | null)?.email ?? null,
    contactName: (v.profiles as { full_name?: string } | null)?.full_name ?? null,
    appliedAt: String(v.created_at ?? ""),
    bookingCount: 0,
    spendCents: 0,
  }));
}

// ---------- seed ----------
const seedClients: AdminClient[] = [
  {
    id: "demo-client",
    fullName: "Charlotte Eames",
    email: "charlotte@eamesco.nz",
    phone: "+64 27 000 0000",
    bookingCount: 1,
    lifetimeSpendCents: 10350,
    lastEventDate: "2026-06-14",
  },
  {
    id: "demo-2",
    fullName: "Maeve Hallam",
    email: "maeve.h@example.com",
    phone: "+64 27 555 1234",
    bookingCount: 2,
    lifetimeSpendCents: 28200,
    lastEventDate: "2025-11-12",
  },
  {
    id: "demo-3",
    fullName: "Sophie Chen",
    email: "sophie@example.com",
    phone: null,
    bookingCount: 1,
    lifetimeSpendCents: 14300,
    lastEventDate: "2026-06-22",
  },
];

const seedVendors: AdminVendor[] = [
  {
    id: "v_eames",
    businessName: "Eames & Co. Wedding Planning",
    vendorType: "planner",
    region: "Queenstown",
    status: "approved",
    discountPct: 15,
    discountTier: "Trade-15",
    contactEmail: "charlotte@eamesco.nz",
    contactName: "Charlotte Eames",
    appliedAt: "2024-01-09T00:00:00Z",
    bookingCount: 14,
    spendCents: 312000,
  },
  {
    id: "v_margot",
    businessName: "Margot Group",
    vendorType: "wholesale",
    region: "Queenstown",
    status: "approved",
    discountPct: 20,
    discountTier: "Trade-20",
    contactEmail: "ops@margot.co.nz",
    contactName: "Reuben Sharp",
    appliedAt: "2024-08-09T00:00:00Z",
    bookingCount: 6,
    spendCents: 184000,
  },
  {
    id: "v_studio_field",
    businessName: "Studio Field",
    vendorType: "stylist",
    region: "Wanaka",
    status: "in_review",
    discountPct: 0,
    discountTier: null,
    contactEmail: "hello@studiofield.co.nz",
    contactName: "Anika Field",
    appliedAt: "2026-04-22T00:00:00Z",
    bookingCount: 0,
    spendCents: 0,
  },
];
