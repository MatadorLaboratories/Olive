import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "./_supabase-available";
import { rowToCustomOrder } from "./admin/pipeline";
import type { CustomOrder } from "@/types/domain";

/**
 * Read services for the customer-facing custom-orders portal.
 *
 * RLS owns the access boundary — these helpers run through the user-scoped
 * Supabase client so a non-owner reading by reference simply gets `null`.
 * Demo mode (no Supabase) returns deterministic seed data so screenshots
 * keep telling the right story.
 */

export async function getCustomOrdersForCurrentUser(): Promise<CustomOrder[]> {
  if (!supabaseAvailable()) return demoOrdersForCurrentUser;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("custom_orders")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map(rowToCustomOrder);
}

/**
 * Look up a single custom order by reference for the current viewer.
 * Returns `null` if the row doesn't exist, RLS blocks it, or the viewer
 * isn't authenticated.
 */
export async function getCustomOrderForCurrentUser(
  reference: string,
): Promise<CustomOrder | null> {
  if (!supabaseAvailable()) {
    return demoOrdersForCurrentUser.find((o) => o.reference === reference) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("custom_orders")
    .select("*")
    .eq("reference", reference)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToCustomOrder(data as Record<string, unknown>);
}

// ---------- demo seeds ----------

const demoOrdersForCurrentUser: CustomOrder[] = [
  {
    id: "co-demo-1",
    reference: "OLV-CO-1188",
    status: "quote_sent",
    customerId: null,
    customerType: "restaurant",
    businessName: "Larder & Co.",
    contactName: "Demo Customer",
    contactEmail: "demo@example.com",
    contactPhone: null,
    fabric: "linen",
    edgeStyle: "scallop",
    colour: "olive",
    quantityTier: "tier_250",
    quantity: 240,
    preferredDeadline: "2026-09-12",
    brandNotes: "Embroidered L in olive thread, lower-right corner.",
    internalNotes: null,
    logoUrl: null,
    inspirationUrls: [],
    quoteTotalCents: 318000,
    depositPaidCents: 0,
    totalPaidCents: 0,
    paidAt: null,
    paymentSetting: "deposit",
    createdAt: "2026-04-25T09:00:00Z",
    updatedAt: "2026-04-29T15:30:00Z",
    designJson: null,
    designPreviewUrl: null,
  },
];
