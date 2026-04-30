"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "./_supabase-available";

const settingsSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name."),
  phone: z.string().trim().max(50).optional().nullable(),
  businessName: z.string().trim().max(120).optional().nullable(),
});

export async function saveAccountSettings(formData: FormData) {
  const parsed = settingsSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    businessName: formData.get("businessName"),
  });

  if (!parsed.success) {
    redirect("/account/settings?error=invalid");
  }

  if (!supabaseAvailable()) {
    redirect("/account/settings?error=demo");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/account/settings");
  }

  const payload = {
    full_name: parsed.data.fullName,
    phone: parsed.data.phone || null,
    business_name: parsed.data.businessName || null,
  };

  type ProfileUpdate = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message?: string | null } | null }>;
    };
  };

  const { error: profileError } = await (supabase.from("profiles") as unknown as ProfileUpdate)
    .update(payload)
    .eq("id", user.id);

  if (profileError) {
    console.error("[account.settings] profile update failed", profileError);
    redirect("/account/settings?error=save");
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });

  if (authError) {
    console.warn("[account.settings] auth metadata update failed", authError);
  }

  revalidatePath("/account", "layout");
  revalidatePath("/account/settings");
  redirect("/account/settings?saved=1");
}
