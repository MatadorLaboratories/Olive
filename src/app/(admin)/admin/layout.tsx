import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentProfile } from "@/services/auth";
import { supabaseAvailable } from "@/services/_supabase-available";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // In demo mode (no Supabase) we let admin pages render so the platform is
  // explorable by reviewers. Connected mode enforces the admin role.
  if (supabaseAvailable()) {
    const profile = await getCurrentProfile();
    const role = (profile as { role?: string } | null)?.role;
    if (role !== "admin" && role !== "staff") {
      redirect("/login?next=/admin");
    }
  }

  return <AdminShell>{children}</AdminShell>;
}
