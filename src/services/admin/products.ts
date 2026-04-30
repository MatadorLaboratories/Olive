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
  heroImageUrl: z.string().optional().nullable(),
  hirePriceCents: z.coerce.number().int().nonnegative().optional().nullable(),
  retailPriceCents: z.coerce.number().int().nonnegative().optional().nullable(),
  replacementCostCents: z.coerce.number().int().nonnegative().optional().nullable(),
  displayOrder: z.coerce.number().int().nonnegative().default(100),
});

export type ProductInput = z.infer<typeof productSchema>;

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

  const row = {
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
    hero_image_url: data.heroImageUrl,
    hire_price_cents: data.hirePriceCents,
    retail_price_cents: data.retailPriceCents,
    replacement_cost_cents: data.replacementCostCents,
    display_order: data.displayOrder,
  };

  type Upsert = {
    upsert: (row: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
  };
  const { error } = await (admin.from("products") as unknown as Upsert).upsert(row, { onConflict: "slug" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/shop/${data.slug}`);
  return { ok: true };
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
