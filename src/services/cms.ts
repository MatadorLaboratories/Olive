import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "./_supabase-available";
import { seedCms, type SeedCmsKey } from "@/data/seed/cms";
import { seedTestimonials } from "@/data/seed/testimonials";
import type { Testimonial } from "@/types/domain";

/**
 * Gets a CMS block keyed by name (e.g. "home.hero").
 * Returns the seed when DB isn't connected.
 *
 * The `key` is constrained to known seed keys for type safety. Adding a
 * new block means: append seed → refer to it by key — admin UI in Phase 3
 * supports any key.
 */
export async function getCmsBlock<K extends SeedCmsKey>(
  key: K,
): Promise<typeof seedCms[K]> {
  const fallback = seedCms[key];

  if (!supabaseAvailable()) return fallback;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cms_blocks")
    .select("data")
    .eq("key", key)
    .maybeSingle<{ data: unknown }>();

  if (error || !data) return fallback;
  return (data.data as typeof seedCms[K]) ?? fallback;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!supabaseAvailable()) return seedTestimonials;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("published", true)
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) return seedTestimonials;

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    quote: String(row.quote),
    attribution: String(row.attribution),
    role: (row.role as string | null) ?? null,
    event: (row.event as string | null) ?? null,
    imageUrl: (row.image_url as string | null) ?? null,
  }));
}
