"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "../_supabase-available";

export async function approveVendor(vendorId: string, discountPct: number, tier: string) {
  if (!supabaseAvailable()) return { ok: true };

  const admin = createSupabaseAdminClient();
  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { error } = await (admin.from("vendor_profiles") as unknown as Update)
    .update({
      status: "approved",
      discount_pct: discountPct,
      discount_tier: tier,
      approved_at: new Date().toISOString(),
    })
    .eq("id", vendorId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/vendors");
  return { ok: true };
}

export async function rejectVendor(vendorId: string) {
  if (!supabaseAvailable()) return { ok: true };
  const admin = createSupabaseAdminClient();
  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { error } = await (admin.from("vendor_profiles") as unknown as Update)
    .update({ status: "rejected" })
    .eq("id", vendorId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/vendors");
  return { ok: true };
}

export async function suspendVendor(vendorId: string) {
  if (!supabaseAvailable()) return { ok: true };
  const admin = createSupabaseAdminClient();
  type Update = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { error } = await (admin.from("vendor_profiles") as unknown as Update)
    .update({ status: "suspended" })
    .eq("id", vendorId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/vendors");
  return { ok: true };
}
