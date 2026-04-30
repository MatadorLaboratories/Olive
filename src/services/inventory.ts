import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "./_supabase-available";

/**
 * Inventory service — single source of truth for stock-level questions.
 *
 * The DB function `available_qty(product_id, start, end)` does the math:
 *   total - damaged - lost - retired - allocated_for_overlapping_bookings
 *
 * When Supabase is not connected, we use a generous static seed availability
 * so the booking-flow UX still works. Replace seed numbers with real
 * `inventory_items` rows once the DB is wired.
 */

/** Seed availability per product slug — used only when DB isn't connected. */
const SEED_AVAILABILITY: Record<string, number> = {
  "scallop-napkin-bone":   320,
  "scallop-napkin-clay":   240,
  "scallop-napkin-olive":  240,
  "plain-napkin-oat":      400,
  "long-tablecloth-cream": 24,
  "long-tablecloth-sage":  18,
  "runner-olive":          40,
  "runner-clay":           36,
  "napkin-set-gift-box":   80,
  "olive-leaf-candle":     60,
};

const DEFAULT_SEED_AVAILABILITY = 50;

export async function getAvailableQty(
  productId: string,
  startDate: string,
  endDate: string,
  productSlug?: string,
): Promise<number> {
  if (!supabaseAvailable()) {
    // Seed-mode fallback. Slug is more stable than UUID for our seed set.
    if (productSlug && productSlug in SEED_AVAILABILITY) {
      return SEED_AVAILABILITY[productSlug]!;
    }
    return DEFAULT_SEED_AVAILABILITY;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("available_qty" as never, {
    p_product_id: productId,
    p_start: startDate,
    p_end: endDate,
  } as never);
  if (error) {
    console.warn("[inventory.getAvailableQty] RPC failed; falling back to seed", error.message);
    return DEFAULT_SEED_AVAILABILITY;
  }
  return Number(data ?? 0);
}

export async function getAllocatedQty(
  productId: string,
  startDate: string,
  endDate: string,
): Promise<number> {
  if (!supabaseAvailable()) return 0;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("allocated_qty" as never, {
    p_product_id: productId,
    p_start: startDate,
    p_end: endDate,
  } as never);
  if (error) return 0;
  return Number(data ?? 0);
}

/**
 * Bulk version — fetches availability for many products at once.
 * Saves N+1 round-trips on the booking products step.
 */
export async function getAvailabilityMap(
  products: Array<{ id: string; slug: string }>,
  startDate: string,
  endDate: string,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!supabaseAvailable()) {
    for (const p of products) {
      map.set(p.id, SEED_AVAILABILITY[p.slug] ?? DEFAULT_SEED_AVAILABILITY);
    }
    return map;
  }
  // Phase 3: optimise into a single RPC; for now, parallelise.
  await Promise.all(
    products.map(async (p) => {
      const qty = await getAvailableQty(p.id, startDate, endDate, p.slug);
      map.set(p.id, qty);
    }),
  );
  return map;
}
