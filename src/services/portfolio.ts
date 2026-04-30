import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "./_supabase-available";
import { seedPortfolio } from "@/data/seed/portfolio";
import type { PortfolioItem } from "@/types/domain";

export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  if (!supabaseAvailable()) return seedPortfolio;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("published", true)
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.warn("[portfolio.getPortfolioItems] fallback to seed:", error.message);
    return seedPortfolio;
  }
  return data.map(rowToItem);
}

export async function getPortfolioItemBySlug(slug: string): Promise<PortfolioItem | null> {
  if (!supabaseAvailable()) return seedPortfolio.find((p) => p.slug === slug) ?? null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return seedPortfolio.find((p) => p.slug === slug) ?? null;
  return rowToItem(data);
}

function rowToItem(row: Record<string, unknown>): PortfolioItem {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    venue: (row.venue as string | null) ?? null,
    eventDate: (row.event_date as string | null) ?? null,
    coverUrl: (row.cover_url as string | null) ?? null,
    galleryUrls: (row.gallery_urls as string[] | null) ?? [],
    shortDescription: (row.short_description as string | null) ?? null,
    bodyMd: (row.body_md as string | null) ?? null,
    vendors: (row.vendors as string[] | null) ?? [],
    published: Boolean(row.published),
  };
}
