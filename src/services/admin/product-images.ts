"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "../_supabase-available";

const ALLOWED = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/svg+xml",
];
const MAX_BYTES = 12 * 1024 * 1024; // 12MB

export type ProductImageKind = "hero" | "gallery";

export type ProductImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Upload a product image to `public-media/products/{slug}/...` and persist
 * it onto the matching products row. Hero replaces `hero_image_url`; gallery
 * appends to `gallery_urls`.
 *
 * Admin-gated: storage RLS already restricts `public-media` writes to admin.
 */
export async function uploadProductImage(
  formData: FormData,
): Promise<ProductImageResult> {
  if (!supabaseAvailable()) {
    return { ok: false, error: "Uploads need Supabase configured." };
  }

  const slug = String(formData.get("slug") ?? "").trim();
  const kind = String(formData.get("kind") ?? "hero") as ProductImageKind;
  const file = formData.get("file") as File | null;

  if (!slug) return { ok: false, error: "Product slug is required." };
  if (!file) return { ok: false, error: "Pick a file first." };
  if (file.size > MAX_BYTES) return { ok: false, error: "File too large (12 MB max)." };
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: "Use PNG, JPG, WebP, AVIF or SVG." };
  }

  const admin = createSupabaseAdminClient();

  // Resolve the product id (we need it to update gallery_urls atomically).
  type Sel = {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{
          data: {
            id: string;
            hero_image_url: string | null;
            gallery_urls: string[] | null;
          } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
  const { data: product, error: readErr } = await (
    admin.from("products") as unknown as Sel
  )
    .select("id, hero_image_url, gallery_urls")
    .eq("slug", slug)
    .maybeSingle();

  if (readErr || !product) {
    return { ok: false, error: "Product not found." };
  }

  // Build a path. Public URLs need to be unique per upload so we always
  // bust caches and never collide.
  const ext = mimeToExt(file.type);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const path = `products/${slug}/${kind}-${Date.now()}-${safeName}${ext ? "." + ext : ""}`;

  const bytes = await file.arrayBuffer();
  const upload = await admin.storage
    .from("public-media")
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (upload.error) {
    console.error("[uploadProductImage] storage error", upload.error);
    return { ok: false, error: "Upload failed — please try again." };
  }

  const { data: pub } = admin.storage.from("public-media").getPublicUrl(path);
  const publicUrl = pub.publicUrl;
  if (!publicUrl) {
    return { ok: false, error: "Could not resolve public URL." };
  }

  // Persist on the row.
  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ error: { message: string } | null }>;
    };
  };

  if (kind === "hero") {
    const { error } = await (admin.from("products") as unknown as Update)
      .update({ hero_image_url: publicUrl })
      .eq("id", product.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const next = [...(product.gallery_urls ?? []), publicUrl];
    const { error } = await (admin.from("products") as unknown as Update)
      .update({ gallery_urls: next })
      .eq("id", product.id);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/admin/products/${slug}`);
  revalidatePath("/admin/products");
  revalidatePath(`/shop/${slug}`);
  revalidatePath("/shop");
  revalidatePath("/");

  return { ok: true, url: publicUrl };
}

/**
 * Remove a stored image from the product row + delete the storage object.
 * For `hero`, just nulls the field. For `gallery`, removes the matching URL
 * from the array.
 *
 * Storage delete is best-effort: if the file isn't ours (e.g. a CMS-seeded
 * URL) we still clear the DB reference so the UI is consistent.
 */
export async function removeProductImage(args: {
  slug: string;
  kind: ProductImageKind;
  url: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseAvailable()) return { ok: true };

  const admin = createSupabaseAdminClient();

  type Sel = {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{
          data: {
            id: string;
            hero_image_url: string | null;
            gallery_urls: string[] | null;
          } | null;
        }>;
      };
    };
  };
  const { data: product } = await (admin.from("products") as unknown as Sel)
    .select("id, hero_image_url, gallery_urls")
    .eq("slug", args.slug)
    .maybeSingle();
  if (!product) return { ok: false, error: "Product not found." };

  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ error: { message: string } | null }>;
    };
  };

  if (args.kind === "hero") {
    await (admin.from("products") as unknown as Update)
      .update({ hero_image_url: null })
      .eq("id", product.id);
  } else {
    const next = (product.gallery_urls ?? []).filter((u) => u !== args.url);
    await (admin.from("products") as unknown as Update)
      .update({ gallery_urls: next })
      .eq("id", product.id);
  }

  // Best-effort storage cleanup: only attempt when the URL is in our bucket.
  const path = extractPublicMediaPath(args.url);
  if (path) {
    await admin.storage.from("public-media").remove([path]);
  }

  revalidatePath(`/admin/products/${args.slug}`);
  revalidatePath("/admin/products");
  revalidatePath(`/shop/${args.slug}`);
  revalidatePath("/shop");
  revalidatePath("/");

  return { ok: true };
}

/**
 * Reorder the gallery list for a product.
 *
 * Accepts the full ordered list of URLs to keep the action contract simple.
 */
export async function reorderProductGallery(args: {
  slug: string;
  urls: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseAvailable()) return { ok: true };

  const admin = createSupabaseAdminClient();
  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { error } = await (admin.from("products") as unknown as Update)
    .update({ gallery_urls: args.urls })
    .eq("slug", args.slug);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/products/${args.slug}`);
  revalidatePath(`/shop/${args.slug}`);
  return { ok: true };
}

// ---- helpers ----

function mimeToExt(mime: string): string | null {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "image/svg+xml":
      return "svg";
    default:
      return null;
  }
}

/**
 * If the URL is a Supabase public URL pointing into our `public-media`
 * bucket, return the storage path. Otherwise return null.
 */
function extractPublicMediaPath(url: string): string | null {
  // Public URLs look like:
  //   https://<project>.supabase.co/storage/v1/object/public/public-media/<path>
  const match = url.match(/\/storage\/v1\/object\/public\/public-media\/(.+)$/);
  return match ? decodeURIComponent(match[1]!) : null;
}
