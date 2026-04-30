"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "./_supabase-available";
import type { ServerActionResult } from "./enquiries";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const timelineSchema = z.object({
  bookingReference: z.string().min(1),
});

/**
 * Upload a timeline document to Supabase Storage `client-uploads`.
 *
 * Path format: `{userId}/{bookingId}/timeline-{timestamp}-{filename}`
 * RLS on the storage bucket scopes reads to the owner + admin.
 */
export async function uploadTimeline(formData: FormData): Promise<ServerActionResult<{ url: string }>> {
  const parsed = timelineSchema.safeParse({
    bookingReference: formData.get("bookingReference"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const file = formData.get("file") as File | null;
  if (!file) return { ok: false, error: "Pick a file first." };
  if (file.size > MAX_BYTES) return { ok: false, error: "File too large (10MB max)." };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Unsupported file type. PDF, image or .docx only." };
  }

  if (!supabaseAvailable()) {
    return { ok: false, error: "Uploads are unavailable in demo mode." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  // Look up the booking to authorise + name the path
  type BookingSel = {
    select: (cols: string) => {
      eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { id: string; client_id: string | null; vendor_id: string | null } | null }> };
    };
  };
  const { data: booking } = await (supabase.from("bookings") as unknown as BookingSel)
    .select("id, client_id, vendor_id")
    .eq("reference", parsed.data.bookingReference)
    .maybeSingle();

  if (!booking) return { ok: false, error: "Booking not found." };
  if (booking.client_id !== user.id && booking.vendor_id !== user.id) {
    return { ok: false, error: "You don't have access to this booking." };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${booking.id}/timeline-${Date.now()}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("client-uploads")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[uploadTimeline] storage error", uploadError);
    return { ok: false, error: "Upload failed." };
  }

  // Record the document via admin client (RLS on `documents` is admin-write).
  const admin = createSupabaseAdminClient();
  type DocInsert = { insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
  await (admin.from("documents") as unknown as DocInsert).insert({
    booking_id: booking.id,
    kind: "timeline",
    name: file.name,
    storage_path: path,
    size_bytes: file.size,
    mime_type: file.type,
  });

  // Reflect uploaded path on the booking so it appears in admin views.
  type BookingUpdate = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  await (admin.from("bookings") as unknown as BookingUpdate)
    .update({ timeline_url: path })
    .eq("id", booking.id);

  revalidatePath(`/account/bookings/${parsed.data.bookingReference}`);
  revalidatePath("/account/documents");

  return { ok: true, data: { url: path } };
}
