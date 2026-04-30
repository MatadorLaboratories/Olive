"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "../_supabase-available";
import type { BookingStatus } from "@/types/domain";

const ALL_STATUSES: BookingStatus[] = [
  "enquiry", "quoted", "deposit_pending", "confirmed", "final_pending",
  "final_paid", "packed", "delivered", "returned", "completed", "cancelled", "archived",
];

export async function transitionBookingStatus(bookingId: string, status: BookingStatus) {
  if (!ALL_STATUSES.includes(status)) return { ok: false, error: "Unknown status." };
  if (!supabaseAvailable()) return { ok: true };

  const admin = createSupabaseAdminClient();
  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  const patch: Record<string, unknown> = { status };
  if (status === "confirmed") patch.confirmed_at = new Date().toISOString();
  if (status === "cancelled") patch.cancelled_at = new Date().toISOString();

  const { error } = await (admin.from("bookings") as unknown as Update).update(patch).eq("id", bookingId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true };
}

export async function toggleAdminOverride(bookingId: string, value: boolean) {
  if (!supabaseAvailable()) return { ok: true };

  const admin = createSupabaseAdminClient();
  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { error } = await (admin.from("bookings") as unknown as Update)
    .update({ admin_override: value, cutoff_locked: !value })
    .eq("id", bookingId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true };
}

export async function updateInternalNotes(bookingId: string, notes: string) {
  if (!supabaseAvailable()) return { ok: true };

  const admin = createSupabaseAdminClient();
  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { error } = await (admin.from("bookings") as unknown as Update)
    .update({ notes_internal: notes })
    .eq("id", bookingId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true };
}
