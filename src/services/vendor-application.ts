"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "./_supabase-available";
import { sendTransactional } from "./email";
import { site } from "@/config/site";
import type { ServerActionResult } from "./enquiries";

const applicationSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  vendorType: z.enum(["planner", "stylist", "venue", "wholesale", "other"]),
  region: z.string().optional().nullable(),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Looks like that's not an email"),
  phone: z.string().optional().nullable(),
  abnOrNzbn: z.string().optional().nullable(),
  password: z.string().min(8, "Password must be 8+ characters"),
  notes: z.string().optional().nullable(),
});

export type VendorApplicationInput = z.infer<typeof applicationSchema>;

/**
 * Apply to be a vendor.
 *
 * Creates the auth user, the profile (with role=vendor), and the vendor_profiles
 * row with status='applied'. Admin approval lifts the status to 'approved' and
 * sets the discount tier.
 *
 * In demo mode, returns a graceful pseudo-success.
 */
export async function applyAsVendor(input: VendorApplicationInput): Promise<ServerActionResult<{ pending: true }>> {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path.join(".");
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, error: "Please check the form.", fieldErrors };
  }
  const data = parsed.data;

  if (!supabaseAvailable()) {
    // Demo: pretend it succeeded.
    return { ok: true, data: { pending: true } };
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  // 1. Create the auth user.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { full_name: data.contactName } },
  });
  if (authError || !authData.user) {
    return { ok: false, error: authError?.message ?? "Couldn't create your account." };
  }
  const userId = authData.user.id;

  // 2. Update the profile to vendor role + business name.
  type ProfileUpdate = {
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  await (admin.from("profiles") as unknown as ProfileUpdate)
    .update({
      role: "vendor",
      full_name: data.contactName,
      business_name: data.businessName,
      phone: data.phone,
      email: data.email,
    })
    .eq("id", userId);

  // 3. Insert vendor_profiles row.
  type VendorInsert = { insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
  const { error: vendorError } = await (admin.from("vendor_profiles") as unknown as VendorInsert).insert({
    id: userId,
    status: "applied",
    vendor_type: data.vendorType,
    region: data.region,
    abn_or_nzbn: data.abnOrNzbn,
    notes: data.notes,
  });
  if (vendorError) {
    console.error("[applyAsVendor] vendor_profiles insert failed", vendorError);
    return { ok: false, error: "Couldn't save your application." };
  }

  // 4. Notify the studio.
  if (process.env.RESEND_API_KEY) {
    try {
      await sendTransactional({
        to: site.contactEmail,
        subject: `New trade application — ${data.businessName}`,
        html: `
          <h2 style="font-family:Georgia,serif;color:#2a3520">New trade application</h2>
          <ul style="font-family:Inter,sans-serif">
            <li><strong>Business:</strong> ${escape(data.businessName)} (${escape(data.vendorType)})</li>
            <li><strong>Contact:</strong> ${escape(data.contactName)} — ${escape(data.email)}</li>
            <li><strong>Phone:</strong> ${escape(data.phone ?? "—")}</li>
            <li><strong>Region:</strong> ${escape(data.region ?? "—")}</li>
            <li><strong>NZBN/ABN:</strong> ${escape(data.abnOrNzbn ?? "—")}</li>
          </ul>
          ${data.notes ? `<p style="font-family:Inter,sans-serif;white-space:pre-line"><strong>Notes:</strong><br>${escape(data.notes)}</p>` : ""}
          <p style="font-family:Inter,sans-serif">
            <a href="${site.url}/admin/vendors">Review in admin</a>
          </p>
        `,
      });
    } catch (e) {
      console.warn("[applyAsVendor] notify failed", e);
    }
  }

  return { ok: true, data: { pending: true } };
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
