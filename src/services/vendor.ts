import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "./_supabase-available";

export type VendorContext = {
  id: string;
  businessName: string;
  contactName: string;
  status: "applied" | "in_review" | "approved" | "suspended" | "rejected";
  discountPct: number;
  discountTier: string | null;
  region: string | null;
};

export type VendorAddress = {
  id: string;
  label: string;
  addressLine: string | null;
  city: string | null;
  region: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
};

const SEED_CONTEXT: VendorContext = {
  id: "demo-vendor",
  businessName: "Eames & Co. Wedding Planning",
  contactName: "Charlotte Eames",
  status: "approved",
  discountPct: 15,
  discountTier: "Trade-15",
  region: "Queenstown",
};

const SEED_ADDRESSES: VendorAddress[] = [
  {
    id: "va-1",
    label: "Glenorchy Estate",
    addressLine: "47 Glenorchy-Queenstown Road",
    city: "Glenorchy",
    region: "Queenstown",
    contactName: "Estate manager",
    contactPhone: "+64 3 442 9999",
    notes: "Always deliver via the side gate. Marquee crew on-site after 9am.",
  },
  {
    id: "va-2",
    label: "Kelvin Heights — Aileen's place",
    addressLine: "12 Lake Vista",
    city: "Queenstown",
    region: "Queenstown",
    contactName: "Aileen Hartley",
    contactPhone: "+64 21 555 0102",
    notes: null,
  },
];

export async function getVendorContext(): Promise<VendorContext | null> {
  if (!supabaseAvailable()) return SEED_CONTEXT;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("vendor_profiles")
    .select("*, profiles:id(full_name, business_name, role)")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  type Row = {
    id: string;
    status: VendorContext["status"];
    discount_pct: number;
    discount_tier: string | null;
    region: string | null;
    profiles: { full_name?: string; business_name?: string; role?: string } | null;
  };
  const r = data as unknown as Row;
  return {
    id: r.id,
    businessName: r.profiles?.business_name ?? r.profiles?.full_name ?? "—",
    contactName: r.profiles?.full_name ?? "—",
    status: r.status,
    discountPct: Number(r.discount_pct ?? 0),
    discountTier: r.discount_tier,
    region: r.region,
  };
}

export async function getVendorAddresses(vendorId: string): Promise<VendorAddress[]> {
  if (!supabaseAvailable()) return SEED_ADDRESSES;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_addresses")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    label: String(row.label),
    addressLine: (row.address_line as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    region: (row.region as string | null) ?? null,
    contactName: (row.contact_name as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
  }));
}

export async function getVendorBookings(vendorId: string) {
  if (!supabaseAvailable()) {
    const { seedBookings } = await import("@/data/seed/bookings");
    return seedBookings.map((b) => ({ ...b, vendorId }));
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, booking_items(*)")
    .eq("vendor_id", vendorId)
    .order("event_date", { ascending: true });
  if (!data) return [];
  return data;
}
