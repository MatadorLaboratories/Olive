import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "./_supabase-available";
import { seedProducts } from "@/data/seed/products";
import type { Product } from "@/types/domain";

/**
 * Catalogue service — single source for product data on the public site
 * and in the booking flow.
 *
 * When Supabase is configured we read from the live `products` table.
 * Otherwise we serve realistic seed data so the site never looks empty.
 */

export async function getProducts(filter?: {
  kind?: "hire" | "retail";
  category?: string;
  colour?: string;
}): Promise<Product[]> {
  if (!supabaseAvailable()) {
    return applyFilter(seedProducts, filter);
  }

  const supabase = await createSupabaseServerClient();
  const query = supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true });

  const { data, error } = await query;
  if (error) {
    console.warn("[catalogue.getProducts] Supabase error, falling back to seed:", error.message);
    return applyFilter(seedProducts, filter);
  }
  if (!data || data.length === 0) return applyFilter(seedProducts, filter);

  return applyFilter(data.map(rowToProduct), filter);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!supabaseAvailable()) {
    return seedProducts.find((p) => p.slug === slug) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.warn("[catalogue.getProductBySlug] Supabase error, falling back to seed:", error.message);
    return seedProducts.find((p) => p.slug === slug) ?? null;
  }
  if (!data) return seedProducts.find((p) => p.slug === slug) ?? null;
  return rowToProduct(data);
}

export function getProductCategories(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) if (p.category) set.add(p.category);
  return [...set].sort();
}

export function getProductColours(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) if (p.colour) set.add(p.colour);
  return [...set].sort();
}

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------
function applyFilter(
  products: Product[],
  filter?: { kind?: "hire" | "retail"; category?: string; colour?: string },
): Product[] {
  if (!filter) return products;
  return products.filter((p) => {
    if (filter.kind === "hire" && p.kind === "retail") return false;
    if (filter.kind === "retail" && p.kind === "hire") return false;
    if (filter.category && p.category !== filter.category) return false;
    if (filter.colour && p.colour !== filter.colour) return false;
    return true;
  });
}

// Maps a snake_case Supabase row → camelCase domain `Product`.
function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    slug: String(row.slug),
    kind: row.kind as Product["kind"],
    status: row.status as Product["status"],
    name: String(row.name),
    category: (row.category as string | null) ?? null,
    fabric: (row.fabric as string | null) ?? null,
    colour: (row.colour as string | null) ?? null,
    size: (row.size as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    shortDescription: (row.short_description as string | null) ?? null,
    heroImageUrl: (row.hero_image_url as string | null) ?? null,
    galleryUrls: (row.gallery_urls as string[] | null) ?? [],
    hirePriceCents: (row.hire_price_cents as number | null) ?? null,
    retailPriceCents: (row.retail_price_cents as number | null) ?? null,
    replacementCostCents: (row.replacement_cost_cents as number | null) ?? null,
    displayOrder: Number(row.display_order ?? 100),
  };
}
