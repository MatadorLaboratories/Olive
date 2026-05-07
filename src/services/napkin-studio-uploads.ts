"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "./_supabase-available";

const IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_BYTES = 10 * 1024 * 1024;

export type StudioUploadResult =
  | { ok: true; url: string; storagePath: string }
  | { ok: false; error: string };

/**
 * Upload an image used inside the napkin design studio (a logo, monogram,
 * or imported artwork). Stored under
 * `public-media/napkin-uploads/{token}/...` so anonymous customers can use
 * the studio before signing in. The path is returned + persisted as the
 * `storagePath` on the design's image element.
 */
export async function uploadNapkinAsset(
  formData: FormData,
  token: string,
): Promise<StudioUploadResult> {
  const file = formData.get("file") as File | null;
  if (!file) return { ok: false, error: "No file selected." };
  if (file.size > MAX_BYTES) return { ok: false, error: "File too large (10 MB max)." };
  if (!IMAGE_MIMES.includes(file.type)) {
    return { ok: false, error: "Use PNG, JPG, WebP or SVG." };
  }
  if (!supabaseAvailable()) {
    return { ok: false, error: "Uploads need Supabase configured." };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const path = `napkin-uploads/${token}/${Date.now()}-${safeName}`;
  const bytes = await file.arrayBuffer();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const writer = user ? supabase : createSupabaseAdminClient();

  const { error: uploadError } = await writer.storage
    .from("public-media")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("[napkin-studio] upload failed", uploadError);
    return { ok: false, error: "Upload failed — please try again." };
  }

  const { data: pub } = writer.storage.from("public-media").getPublicUrl(path);
  if (!pub.publicUrl) return { ok: false, error: "Could not resolve public URL." };

  return { ok: true, url: pub.publicUrl, storagePath: path };
}

/**
 * Persist a flattened PNG snapshot of the design canvas. Called from the
 * studio at submit-time once `stage.toDataURL('image/png')` has produced
 * the bytes. The returned URL is written to
 * `custom_orders.design_preview_url` so the admin list / receipt path can
 * render it without rehydrating Konva.
 */
export async function uploadNapkinPreview(args: {
  reference: string;
  /** data: URL produced by `stage.toDataURL('image/png')`. */
  dataUrl: string;
}): Promise<StudioUploadResult> {
  if (!supabaseAvailable()) {
    return { ok: false, error: "Storage not configured." };
  }
  const match = args.dataUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
  if (!match) return { ok: false, error: "Invalid preview data URL." };

  const ext = match[1] === "jpeg" ? "jpg" : match[1]!;
  const bytes = Buffer.from(match[2]!, "base64");
  if (bytes.length > MAX_BYTES) {
    return { ok: false, error: "Preview too large." };
  }

  const safeRef = args.reference.replace(/[^a-zA-Z0-9._-]/g, "_") || "untitled";
  const path = `napkin-designs/${safeRef}-${Date.now()}.${ext}`;

  const admin = createSupabaseAdminClient();
  const { error: uploadError } = await admin.storage
    .from("public-media")
    .upload(path, bytes, {
      contentType: `image/${match[1]}`,
      upsert: true,
      cacheControl: "31536000",
    });
  if (uploadError) {
    console.error("[napkin-studio] preview upload failed", uploadError);
    return { ok: false, error: "Couldn't save preview." };
  }
  const { data: pub } = admin.storage.from("public-media").getPublicUrl(path);
  if (!pub.publicUrl) return { ok: false, error: "Could not resolve public URL." };

  // Mirror the URL onto the matching custom_orders row so admin / receipt
  // surfaces can pull it without re-rendering Konva.
  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  await (admin.from("custom_orders") as unknown as Update)
    .update({ design_preview_url: pub.publicUrl })
    .eq("reference", args.reference);

  return { ok: true, url: pub.publicUrl, storagePath: path };
}
