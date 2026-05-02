import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "../_supabase-available";
import { rowToProduct } from "../catalogue";
import { seedProducts } from "@/data/seed/products";
import type { Product } from "@/types/domain";

/**
 * Admin-scope product reads.
 *
 * The customer-facing `services/catalogue.ts` reads filter by
 * `status = 'active'` so drafts and archived rows never leak to the shop
 * or booking flow. The admin needs the opposite — it manages every row,
 * regardless of status, so a freshly created draft doesn't disappear
 * the moment it's saved.
 *
 * RLS still gates access; this file just removes the status filter from
 * the query and gives the admin the full table back.
 */

/** All products, ordered by display_order. Admin index uses this. */
export async function getAdminProducts(): Promise<Product[]> {
  if (!supabaseAvailable()) return [...seedProducts];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("display_order", { ascending: true });

  if (error || !data) {
    console.warn("[admin.products] read failed", error?.message);
    return [...seedProducts];
  }
  return (data as Array<Record<string, unknown>>).map(rowToProduct);
}

/** Single product by slug, any status. Admin editor uses this. */
export async function getAdminProductBySlug(
  slug: string,
): Promise<Product | null> {
  if (!supabaseAvailable()) {
    return seedProducts.find((p) => p.slug === slug) ?? null;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.warn("[admin.products] read by slug failed", error.message);
    return null;
  }
  if (!data) return null;
  return rowToProduct(data as Record<string, unknown>);
}
