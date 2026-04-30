"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "./_supabase-available";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

export type UploadResult =
  | { ok: true; path: string; signedUrl: string | null }
  | { ok: false; error: string };

/**
 * Upload a logo or inspiration image for a custom-order draft.
 *
 * Public-facing (anonymous OK) — files land in `public-media/custom-uploads/{token}/...`
 * so they're admin-readable. The returned `path` is stored on the draft and
 * promoted to `custom_orders.logo_url` / `inspiration_urls[]` on submit.
 */
export async function uploadCustomBrandFile(
  formData: FormData,
  kind: "logo" | "inspiration",
  token: string,
): Promise<UploadResult> {
  const file = formData.get("file") as File | null;
  if (!file) return { ok: false, error: "No file selected." };
  if (file.size > MAX_BYTES) return { ok: false, error: "File too large (10 MB max)." };
  if (!ALLOWED.includes(file.type)) return { ok: false, error: "Use PNG, JPG, WebP, SVG or PDF." };

  if (!supabaseAvailable()) {
    return {
      ok: false,
      error: "Uploads need Supabase configured. Connect storage credentials to enable.",
    };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `custom-uploads/${token}/${kind}-${Date.now()}-${safeName}`;
  const bytes = await file.arrayBuffer();

  // Use the user's session client when present; fall back to admin so anonymous
  // public-facing visitors can still upload to public-media.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const writer = user ? supabase : createSupabaseAdminClient();

  const { error: uploadError } = await writer.storage
    .from("public-media")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("[custom-uploads] upload failed", uploadError);
    return { ok: false, error: "Upload failed — please try again." };
  }

  const { data: pub } = writer.storage.from("public-media").getPublicUrl(path);
  return { ok: true, path, signedUrl: pub.publicUrl ?? null };
}
