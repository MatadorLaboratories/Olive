import { Lock, Mail, Phone, Save, Sparkles, User2 } from "lucide-react";
import { getCurrentProfile, getCurrentUser } from "@/services/auth";
import { getBookingsForCurrentUser } from "@/services/bookings-read";
import { saveAccountSettings } from "@/services/account-settings";
import { formatDate } from "@/lib/format";

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ saved, error }, profile, user, bookings] = await Promise.all([
    searchParams,
    getCurrentProfile(),
    getCurrentUser(),
    getBookingsForCurrentUser(),
  ]);

  const activeBookings = bookings.filter(
    (booking) => !["completed", "cancelled", "archived"].includes(booking.status),
  ).length;
  const latestBooking = bookings[0] ?? null;

  const message =
    error === "invalid"
      ? "Please check the highlighted details and try again."
      : error === "demo"
        ? "Settings edits are unavailable in demo mode."
        : error === "save"
          ? "We couldn't save your details just now. Please try again."
          : null;

  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <p className="eyebrow mb-3">Settings</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Your <span className="italic font-light">details.</span>
        </h1>
        <p className="mt-4 text-olive-800/80 text-lg leading-relaxed">
          Keep your contact details current so the studio knows who to reach and where to send updates.
        </p>
      </header>

      {saved && (
        <div className="card border-olive-300/60 bg-cream-50 p-5">
          <p className="eyebrow text-olive-700 mb-2">Saved</p>
          <p className="text-sm text-olive-800 leading-relaxed">
            Your profile details have been updated.
          </p>
        </div>
      )}

      {message && (
        <div className="card border-clay-300/60 bg-clay-50/60 p-5">
          <p className="eyebrow text-clay-600 mb-2">We hit a snag</p>
          <p className="text-sm text-olive-800 leading-relaxed">{message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-7 card p-7">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="eyebrow text-clay-500 mb-3">Profile</p>
              <h2 className="font-display text-2xl text-olive-900">Contact details</h2>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-clay-100 text-clay-600">
              <User2 className="h-4 w-4" strokeWidth={1.5} />
            </span>
          </div>

          <form action={saveAccountSettings} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="field-label">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                defaultValue={(profile as { full_name?: string | null } | null)?.full_name ?? ""}
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user?.email ?? (profile as { email?: string | null } | null)?.email ?? ""}
                readOnly
                className="field-input opacity-70 cursor-not-allowed"
              />
              <p className="mt-2 text-sm text-olive-600">
                Your sign-in email is managed through Supabase Auth.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="field-label">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={(profile as { phone?: string | null } | null)?.phone ?? ""}
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="businessName" className="field-label">
                  Business name
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  defaultValue={(profile as { business_name?: string | null } | null)?.business_name ?? ""}
                  className="field-input"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button type="submit" className="btn">
                Save details
                <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </form>
        </section>

        <aside className="lg:col-span-5 space-y-6">
          <div className="card p-7">
            <p className="eyebrow text-clay-500 mb-4">Account</p>
            <dl className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-olive-500 mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <dt className="eyebrow text-olive-600 mb-1">Signed in as</dt>
                  <dd className="text-olive-800 break-all">{user?.email ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-olive-500 mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <dt className="eyebrow text-olive-600 mb-1">Role</dt>
                  <dd className="text-olive-800 capitalize">
                    {((profile as { role?: string | null } | null)?.role ?? "client").replace(/_/g, " ")}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-olive-500 mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <dt className="eyebrow text-olive-600 mb-1">Active bookings</dt>
                  <dd className="text-olive-800">{activeBookings}</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="card p-7">
            <p className="eyebrow text-clay-500 mb-4">Security</p>
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 text-olive-500 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div className="text-sm text-olive-800 leading-relaxed">
                <p className="mb-2">
                  Password changes aren&apos;t self-serve in the portal yet.
                </p>
                <p className="text-olive-600">
                  If you need to reset your password today, sign out and use the password reset flow on the login page.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-7">
            <p className="eyebrow text-clay-500 mb-4">Studio updates</p>
            <p className="text-sm text-olive-800 leading-relaxed">
              Transactional emails for bookings, payments and timing updates stay on so you don&apos;t miss anything important.
            </p>
            {latestBooking && (
              <p className="mt-4 text-sm text-olive-600">
                Latest booking: {latestBooking.reference} on {formatDate(latestBooking.eventDate, "long")}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
