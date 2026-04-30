import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "../_supabase-available";
import { getProducts } from "../catalogue";
import type { Product } from "@/types/domain";

export type InventoryRow = {
  product: Product;
  totalQty: number;
  damagedQty: number;
  lostQty: number;
  retiredQty: number;
  netUsableQty: number;
  stocktakeAt: string | null;
  stocktakeNotes: string | null;
};

const SEED_TOTALS: Record<string, { total: number; damaged: number; lost: number; retired: number }> = {
  "scallop-napkin-bone":   { total: 360, damaged: 8, lost: 12, retired: 20 },
  "scallop-napkin-clay":   { total: 280, damaged: 4, lost: 6,  retired: 10 },
  "scallop-napkin-olive":  { total: 280, damaged: 6, lost: 4,  retired: 12 },
  "plain-napkin-oat":      { total: 480, damaged: 14, lost: 22, retired: 18 },
  "long-tablecloth-cream": { total: 30,  damaged: 1, lost: 0,  retired: 2 },
  "long-tablecloth-sage":  { total: 24,  damaged: 0, lost: 1,  retired: 2 },
  "runner-olive":          { total: 50,  damaged: 1, lost: 2,  retired: 3 },
  "runner-clay":           { total: 42,  damaged: 0, lost: 1,  retired: 2 },
  "napkin-set-gift-box":   { total: 80,  damaged: 0, lost: 0,  retired: 0 },
  "olive-leaf-candle":     { total: 60,  damaged: 0, lost: 0,  retired: 0 },
};

export async function getInventoryRows(): Promise<InventoryRow[]> {
  const products = await getProducts();
  const rows: InventoryRow[] = [];

  if (!supabaseAvailable()) {
    for (const p of products) {
      const seed = SEED_TOTALS[p.slug] ?? { total: 50, damaged: 0, lost: 0, retired: 0 };
      rows.push({
        product: p,
        totalQty: seed.total,
        damagedQty: seed.damaged,
        lostQty: seed.lost,
        retiredQty: seed.retired,
        netUsableQty: seed.total - seed.damaged - seed.lost - seed.retired,
        stocktakeAt: null,
        stocktakeNotes: null,
      });
    }
    return rows;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("inventory_items").select("*");
  const map = new Map<string, Record<string, unknown>>(
    ((data ?? []) as Array<Record<string, unknown>>).map((r) => [String(r.product_id), r]),
  );

  for (const p of products) {
    const r = map.get(p.id);
    const total = Number(r?.total_qty ?? 0);
    const damaged = Number(r?.damaged_qty ?? 0);
    const lost = Number(r?.lost_qty ?? 0);
    const retired = Number(r?.retired_qty ?? 0);
    rows.push({
      product: p,
      totalQty: total,
      damagedQty: damaged,
      lostQty: lost,
      retiredQty: retired,
      netUsableQty: Math.max(0, total - damaged - lost - retired),
      stocktakeAt: (r?.stocktake_at as string | null) ?? null,
      stocktakeNotes: (r?.stocktake_notes as string | null) ?? null,
    });
  }
  return rows;
}
