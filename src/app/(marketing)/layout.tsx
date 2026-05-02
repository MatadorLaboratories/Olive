import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { getCurrentProfile, getCurrentUser } from "@/services/auth";
import type { HeaderUser } from "@/components/marketing/AccountMenu";
import type { UserRole } from "@/types/domain";

export default async function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolve the auth-aware identity for the header. Profile is the source of
  // truth for role + display name; auth user is the fallback for email when
  // a profile row hasn't been written yet.
  const [authUser, profile] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
  ]);

  const user: HeaderUser | null = authUser
    ? {
        fullName:
          ((profile as { full_name?: string | null } | null)?.full_name ?? null) ||
          ((authUser.user_metadata as { full_name?: string } | null)?.full_name ?? null),
        email: authUser.email ?? null,
        role: ((profile as { role?: UserRole } | null)?.role ?? "client") as UserRole,
      }
    : null;

  return (
    <>
      <Header user={user} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
