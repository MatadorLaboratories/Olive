"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "../_supabase-available";
import type { SeedCmsKey } from "@/data/seed/cms";

/**
 * Save a CMS block.
 * The shape of `data` matches the type in `seedCms[key]` — admin form
 * builds it client-side and ships it whole.
 */
export async function saveCmsBlock(key: SeedCmsKey, data: unknown) {
  if (!supabaseAvailable()) return { ok: true };

  const admin = createSupabaseAdminClient();
  type Upsert = {
    upsert: (row: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
  };
  const { error } = await (admin.from("cms_blocks") as unknown as Upsert).upsert(
    { key, data: data as Record<string, unknown>, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) return { ok: false, error: error.message };

  // Public surfaces affected by this block.
  if (key.startsWith("home.")) revalidatePath("/");
  if (key === "about.body" || key === "faqs") revalidatePath("/about");
  if (key === "hospitality.options") revalidatePath("/hospitality/builder");
  revalidatePath("/admin/cms");

  return { ok: true };
}
