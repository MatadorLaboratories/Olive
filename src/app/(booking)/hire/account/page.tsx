import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingShell } from "@/components/booking/BookingShell";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { getDraft } from "@/services/booking-draft";
import { getCurrentUser } from "@/services/auth";

export const metadata: Metadata = { title: "Hire — your account" };

export default async function BookingAccountPage() {
  const draft = await getDraft();
  if (!draft.dates) redirect("/hire/dates");
  if (draft.items.length === 0) redirect("/hire/products");
  if (!draft.details) redirect("/hire/details");

  const user = await getCurrentUser();
  // If they're already signed in, skip straight to deposit.
  if (user) redirect("/hire/deposit");

  return (
    <BookingShell step={5}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <p className="eyebrow mb-4">Step 05 / Account</p>
          <h1 className="font-display text-display-lg text-olive-900 leading-[1] tracking-tight">
            Almost there.{" "}
            <span className="italic font-light">Sign in to confirm.</span>
          </h1>
          <p className="mt-6 text-olive-800/80 max-w-xl leading-relaxed text-lg">
            Your account is where your booking lives — payment status, timeline upload,
            messages with the studio, documents, and re-bookings down the line.
          </p>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h2 className="font-display text-2xl text-olive-900 leading-[1.05] mb-6">
                Already with us? <span className="italic font-light">Sign in.</span>
              </h2>
              <SignInForm next="/hire/deposit" compact />
            </div>
            <div className="lg:border-l lg:border-[color:var(--color-rule)] lg:pl-10">
              <h2 className="font-display text-2xl text-olive-900 leading-[1.05] mb-6">
                Or create an <span className="italic font-light">account.</span>
              </h2>
              <SignUpForm next="/hire/deposit" compact />
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-32 self-start">
          <BookingSummary draft={draft} variant="compact" />
        </aside>
      </div>
    </BookingShell>
  );
}
