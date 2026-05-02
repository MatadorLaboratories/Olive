"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "../_supabase-available";

const productSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2),
  name: z.string().min(2),
  kind: z.enum(["hire", "retail", "both"]),
  status: z.enum(["draft", "active", "archived"]),
  category: z.string().optional().nullable(),
  fabric: z.string().optional().nullable(),
  colour: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  /**
   * Optional. Hero image is managed primarily by `uploadProductImage`;
   * if this field is `undefined` we leave the existing column untouched.
   * Passing `null` would clear it, but the new ProductForm never sends this.
   */
  heroImageUrl: z.string().optional().nullable(),
  hirePriceCents: z.coerce.number().int().nonnegative().optional().nullable(),
  retailPriceCents: z.coerce.number().int().nonnegative().optional().nullable(),
  replacementCostCents: z.coerce.number().int().nonnegative().optional().nullable(),
  displayOrder: z.coerce.number().int().nonnegative().default(100),
});

export type ProductInput = z.infer<typeof productSchema>;

/**
 * Save a product — explicit create vs. update.
 *
 * Branching by `id`:
 *   - With `id`  → UPDATE the existing row keyed on id. Slug can change
 *     freely; uniqueness is enforced by the DB constraint and surfaced
 *     to the user with a clean error.
 *   - Without id → INSERT a new row. Before insert we look up the slug
 *     to make sure we're not silently overwriting an existing product.
 *
 * The previous implementation used `upsert(..., { onConflict: 'slug' })`,
 * which made "create" indistinguishable from "update by slug" and quietly
 * clobbered an existing product if the admin happened to type the same
 * slug. That's data loss — handled here by a real existence check.
 */
export async function saveProduct(input: ProductInput) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (!supabaseAvailable()) {
    return { ok: true };
  }

  const admin = createSupabaseAdminClient();
  const data = parsed.data;
  const isCreate = !data.id;

  // Build the write row without `hero_image_url` and `gallery_urls` — those
  // are owned by the image-upload actions and should never be written from
  // the text form (otherwise an old `initial` value would clobber a freshly
  // uploaded URL that landed since the form mounted).
  const row: Record<string, unknown> = {
    slug: data.slug,
    name: data.name,
    kind: data.kind,
    status: data.status,
    category: data.category,
    fabric: data.fabric,
    colour: data.colour,
    size: data.size,
    description: data.description,
    short_description: data.shortDescription,
    hire_price_cents: data.hirePriceCents,
    retail_price_cents: data.retailPriceCents,
    replacement_cost_cents: data.replacementCostCents,
    display_order: data.displayOrder,
  };
  // Backwards-compat: legacy callers can still set hero_image_url
  // explicitly. The new ProductForm doesn't.
  if (data.heroImageUrl !== undefined) {
    row.hero_image_url = data.heroImageUrl;
  }

  if (isCreate) {
    // Slug-uniqueness pre-check so we can return a friendly message
    // before the DB throws. Race conditions between two admins creating
    // the same slug are caught by the unique constraint at insert time.
    type SlugProbe = {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: { id: string } | null;
          }>;
        };
      };
    };
    const { data: existing } = await (
      admin.from("products") as unknown as SlugProbe
    )
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (existing) {
      return {
        ok: false as const,
        error: `A product with the slug "${data.slug}" already exists. Pick a different slug.`,
      };
    }

    type Insert = {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
    const { error } = await (admin.from("products") as unknown as Insert).insert(row);
    if (error) {
      // Postgres unique-violation code is 23505 — surface it cleanly if
      // the race-condition path lands here.
      if (/duplicate key|unique constraint/i.test(error.message)) {
        return {
          ok: false as const,
          error: `That slug is already taken. Pick a different slug.`,
        };
      }
      return { ok: false as const, error: error.message };
    }
  } else {
    type Update = {
      update: (row: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await (admin.from("products") as unknown as Update)
      .update(row)
      .eq("id", data.id!);
    if (error) {
      if (/duplicate key|unique constraint/i.test(error.message)) {
        return {
          ok: false as const,
          error: `That slug is already taken by another product.`,
        };
      }
      return { ok: false as const, error: error.message };
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/shop/${data.slug}`);
  return { ok: true as const };
}

export async function archiveProduct(id: string) {
  if (!supabaseAvailable()) return { ok: true };
  const admin = createSupabaseAdminClient();
  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { error } = await (admin.from("products") as unknown as Update)
    .update({ status: "archived" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/products");
  return { ok: true };
}
