import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "../_supabase-available";
import type { CustomOrder } from "@/types/domain";

export type Enquiry = {
  id: string;
  source: string | null;
  name: string;
  email: string;
  phone: string | null;
  eventDate: string | null;
  message: string;
  status: "new" | "in_progress" | "converted" | "archived";
  createdAt: string;
};

export async function getEnquiries(): Promise<Enquiry[]> {
  if (!supabaseAvailable()) return seedEnquiries;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    source: (row.source as string | null) ?? null,
    name: (row.name as string) ?? "—",
    email: (row.email as string) ?? "—",
    phone: (row.phone as string | null) ?? null,
    eventDate: (row.event_date as string | null) ?? null,
    message: (row.message as string) ?? "",
    status: row.status as Enquiry["status"],
    createdAt: String(row.created_at ?? ""),
  }));
}

export async function getCustomOrders(): Promise<CustomOrder[]> {
  if (!supabaseAvailable()) return seedCustomOrders;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    reference: String(row.reference),
    status: row.status as CustomOrder["status"],
    customerType: (row.customer_type as string | null) ?? null,
    businessName: (row.business_name as string | null) ?? null,
    contactName: (row.contact_name as string | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    fabric: (row.fabric as string | null) ?? null,
    edgeStyle: (row.edge_style as string | null) ?? null,
    colour: (row.colour as string | null) ?? null,
    quantityTier: (row.quantity_tier as string | null) ?? null,
    quantity: (row.quantity as number | null) ?? null,
    preferredDeadline: (row.preferred_deadline as string | null) ?? null,
    brandNotes: (row.brand_notes as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    inspirationUrls: (row.inspiration_urls as string[] | null) ?? [],
    quoteTotalCents: (row.quote_total_cents as number | null) ?? null,
    paymentSetting: (row.payment_setting as CustomOrder["paymentSetting"]) ?? null,
    createdAt: String(row.created_at ?? ""),
  }));
}

// ---------- seed ----------
const seedEnquiries: Enquiry[] = [
  {
    id: "e1",
    source: "contact",
    name: "Lila Thornton",
    email: "lila@example.com",
    phone: "+64 21 555 9090",
    eventDate: "2026-11-15",
    message:
      "Hi! Planning a hundred-person November wedding at Glenorchy. Looking for cream linen + clay scallops. Would love to chat.",
    status: "new",
    createdAt: "2026-04-28T08:14:00Z",
  },
  {
    id: "e2",
    source: "hospitality",
    name: "Eden Olsen",
    email: "eden@thelarder.co.nz",
    phone: null,
    eventDate: null,
    message:
      "Opening a new natural-wine bar in Arrowtown. Want custom napkins for service — 200 to start. Tell me about turnaround?",
    status: "in_progress",
    createdAt: "2026-04-22T13:01:00Z",
  },
];

const seedCustomOrders: CustomOrder[] = [
  {
    id: "co1",
    reference: "OLV-CO-1184",
    status: "awaiting_quote",
    customerType: "restaurant",
    businessName: "Margot Group",
    contactName: "Reuben Sharp",
    contactEmail: "ops@margot.co.nz",
    fabric: "linen",
    edgeStyle: "scallop",
    colour: "olive",
    quantityTier: "tier_500",
    quantity: 500,
    preferredDeadline: "2026-08-01",
    brandNotes: "Embroidered M in clay thread on lower-right. Match Pantone 174 C.",
    logoUrl: null,
    inspirationUrls: [],
    quoteTotalCents: null,
    paymentSetting: "deposit",
    createdAt: "2026-04-26T10:00:00Z",
  },
  {
    id: "co2",
    reference: "OLV-CO-1182",
    status: "in_production",
    customerType: "venue",
    businessName: "Glenorchy Estate",
    contactName: "Operations",
    contactEmail: "ops@glenorchyestate.nz",
    fabric: "cotton_rayon",
    edgeStyle: "plain",
    colour: "bone",
    quantityTier: "tier_100",
    quantity: 240,
    preferredDeadline: "2026-06-01",
    brandNotes: null,
    logoUrl: null,
    inspirationUrls: [],
    quoteTotalCents: 295200,
    paymentSetting: "deposit",
    createdAt: "2026-03-18T14:00:00Z",
  },
];
