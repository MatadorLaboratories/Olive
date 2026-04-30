"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "./_supabase-available";

const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(2),
  addressLine: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type AddressInput = z.infer<typeof addressSchema>;

export async function saveVendorAddress(input: AddressInput) {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fill the required fields." };
  if (!supabaseAvailable()) {
    revalidatePath("/trade/preferences");
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const row = {
    vendor_id: user.id,
    label: parsed.data.label,
    address_line: parsed.data.addressLine,
    city: parsed.data.city,
    region: parsed.data.region,
    contact_name: parsed.data.contactName,
    contact_phone: parsed.data.contactPhone,
    notes: parsed.data.notes,
  };

  if (parsed.data.id) {
    type Update = {
      update: (row: Record<string, unknown>) => {
        eq: (c: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await (supabase.from("vendor_addresses") as unknown as Update)
      .update(row)
      .eq("id", parsed.data.id);
    if (error) return { ok: false, error: error.message };
  } else {
    type Insert = { insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
    const { error } = await (supabase.from("vendor_addresses") as unknown as Insert).insert(row);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/trade/preferences");
  return { ok: true };
}

export async function deleteVendorAddress(id: string) {
  if (!supabaseAvailable()) {
    revalidatePath("/trade/preferences");
    return { ok: true };
  }
  const supabase = await createSupabaseServerClient();
  type Del = { delete: () => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } };
  const { error } = await (supabase.from("vendor_addresses") as unknown as Del).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/trade/preferences");
  return { ok: true };
}
