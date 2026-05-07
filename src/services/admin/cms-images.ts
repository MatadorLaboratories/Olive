"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "../_supabase-available";

const ALLOWED = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/svg+xml",
];
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

export type CmsImageResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

/**
 * Upload an image used inside a CMS block. The image gets stored under
 * `public-media/cms/{key}/...` so we can revoke / clean up by section later.
 *
 * Returns the public URL the form should write into the CMS JSON. The CMS
 * data itself is just a string field with that URL; storage is the source
 * of truth for the file, and the JSON points at it.
 *
 * Admin-only: storage RLS on `public-media` already gates writes to admin.
 */
export async function uploadCmsImage(
  formData: FormData,
): Promise<CmsImageResult> {
  if (!supabaseAvailable()) {
    return { ok: false, error: "Uploads need Supabase configured." };
  }

  const cmsKey = String(formData.get("cmsKey") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!cmsKey) return { ok: false, error: "Missing CMS key." };
  if (!file) return { ok: false, error: "Pick a file first." };
  if (file.size > MAX_BYTES) return { ok: false, error: "File too large (12 MB max)." };
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: "Use PNG, JPG, WebP, AVIF or SVG." };
  }

  const admin = createSupabaseAdminClient();
  const ext = mimeToExt(file.type);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const safeKey = cmsKey.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `cms/${safeKey}/${Date.now()}-${safeName}${ext ? "." + ext : ""}`;

  const bytes = await file.arrayBuffer();
  const upload = await admin.storage
    .from("public-media")
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (upload.error) {
    console.error("[uploadCmsImage] storage error", upload.error);
    return { ok: false, error: "Upload failed — please try again." };
  }

  const { data: pub } = admin.storage.from("public-media").getPublicUrl(path);
  if (!pub.publicUrl) {
    return { ok: false, error: "Could not resolve public URL." };
  }

  return { ok: true, url: pub.publicUrl, path };
}

function mimeToExt(mime: string): string | null {
  switch (mime) {
    case "image/png": return "png";
    case "image/jpeg": return "jpg";
    case "image/webp": return "webp";
    case "image/avif": return "avif";
    case "image/svg+xml": return "svg";
    default: return null;
  }
}
