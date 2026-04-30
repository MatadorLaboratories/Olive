"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "./_supabase-available";
import type { ServerActionResult } from "./enquiries";

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signupSchema = credSchema.extend({
  fullName: z.string().min(2),
});

/**
 * Get the current authenticated user (or null).
 * Wrapped so callers don't need to import Supabase directly.
 */
export async function getCurrentUser() {
  if (!supabaseAvailable()) return null;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Get the user's profile row (joined client/vendor). */
export async function getCurrentProfile() {
  if (!supabaseAvailable()) return null;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data ?? null;
}

/** Email/password sign-in. Returns a structured result. */
export async function signIn(formData: FormData): Promise<ServerActionResult<{ next: string }>> {
  const parsed = credSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "Please enter a valid email and 8+ character password." };

  if (!supabaseAvailable()) {
    return {
      ok: false,
      error: "Sign-in is unavailable in demo mode. Connect Supabase to enable accounts.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: error.message };

  const next = (formData.get("next") as string) || "/account";
  revalidatePath("/", "layout");
  return { ok: true, data: { next } };
}

/** Email/password sign-up. */
export async function signUp(formData: FormData): Promise<ServerActionResult<{ next: string }>> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Please complete the form." };
  }

  if (!supabaseAvailable()) {
    return {
      ok: false,
      error: "Sign-up is unavailable in demo mode. Connect Supabase to enable accounts.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  });
  if (error) return { ok: false, error: error.message };

  const next = (formData.get("next") as string) || "/account";
  revalidatePath("/", "layout");
  return { ok: true, data: { next } };
}

/** Sign out and redirect home. */
export async function signOut() {
  if (supabaseAvailable()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
