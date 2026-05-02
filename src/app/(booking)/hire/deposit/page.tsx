import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { BookingShell } from "@/components/booking/BookingShell";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { StripePaymentForm } from "@/components/booking/StripePaymentForm";
import { getDraft } from "@/services/booking-draft";
import { getCurrentUser } from "@/services/auth";
import { createBookingFromDraft } from "@/services/create-booking";

export const metadata: Metadata = { title: "Hire — pay deposit" };

export default async function BookingDepositPage() {
  const draft = await getDraft();
  if (!draft.dates) redirect("/hire/dates");
  if (draft.items.length === 0) redirect("/hire/products");
  if (!draft.details) redirect("/hire/details");

  const user = await getCurrentUser();
  // If they aren't signed in, route them through /hire/account first.
  if (!user) {
    // In demo mode there's no auth; treat that case as "skip the account step".
    const result = await createBookingFromDraft(draft);
    if (!result.ok) {
      return <DepositError reference={null} message={result.error} />;
    }
    return (
      <BookingShell step={6}>
        <DepositPanel
          reference={result.reference}
          clientSecret={result.clientSecret}
          demo={result.demo}
        />
      </BookingShell>
    );
  }

  // Authenticated path.
  const result = await createBookingFromDraft(draft);
  if (!result.ok) return <DepositError reference={null} message={result.error} />;

  return (
    <BookingShell step={6}>
      <DepositPanel
        reference={result.reference}
        clientSecret={result.clientSecret}
        demo={result.demo}
      />
    </BookingShell>
  );
}

async function DepositPanel({
  reference,
  clientSecret,
  demo,
}: {
  reference: string;
  clientSecret: string | null;
  demo: boolean;
}) {
  // Re-read draft for the summary card (createBooking clears it on success only
  // when we get a real client_secret; demo mode keeps it for inspection).
  const draft = await getDraft();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7">
        <p className="eyebrow mb-4">Step 06 / Deposit</p>
        <h1 className="font-display text-display-lg text-olive-900 leading-[1] tracking-tight">
          A 50% deposit, <span className="italic font-light">and we're set.</span>
        </h1>
        <p className="mt-6 max-w-xl text-olive-800/80 text-lg leading-relaxed">
          Booking ref{" "}
          <span className="font-display italic text-clay-500">{reference}</span>.
          We'll confirm your booking and lock in your stock and dates.
          The remaining balance is due 30 days before your event — we'll remind you.
        </p>

        <div className="mt-12 max-w-xl">
          {clientSecret ? (
            <StripePaymentForm clientSecret={clientSecret} reference={reference} />
          ) : (
            <DemoPaymentNotice reference={reference} demo={demo} />
          )}
        </div>
      </div>

      <aside className="lg:col-span-5 lg:sticky lg:top-32 self-start">
        <BookingSummary draft={draft} />
      </aside>
    </div>
  );
}

function DemoPaymentNotice({ reference, demo }: { reference: string; demo: boolean }) {
  return (
    <div className="card p-7 border-clay-300/40 bg-clay-50">
      <div className="flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-clay-500 mt-1 shrink-0" strokeWidth={1.5} />
        <div>
          <p className="eyebrow text-clay-600 mb-2">{demo ? "Demo mode" : "Stripe not configured"}</p>
          <p className="font-display text-2xl text-olive-900 leading-snug">
            Your booking <span className="italic font-light">draft</span> is ready as{" "}
            <span className="text-clay-600">{reference}</span>.
          </p>
          <p className="mt-4 text-sm text-olive-700 leading-relaxed">
            Stripe credentials aren't connected yet, so the deposit step is showing
            this demo notice. Add <code className="font-mono text-[12px]">STRIPE_SECRET_KEY</code> and{" "}
            <code className="font-mono text-[12px]">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to{" "}
            <code className="font-mono text-[12px]">.env.local</code> and the Payment Element renders here.
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href={`/hire/confirmation?ref=${reference}&demo=1`} className="btn">
          See the confirmation page
        </Link>
        <Link href="/account" className="btn btn-secondary">My account</Link>
      </div>
    </div>
  );
}

function DepositError({ reference, message }: { reference: string | null; message: string }) {
  return (
    <BookingShell step={6}>
      <div className="max-w-xl">
        <p className="eyebrow text-clay-500 mb-3">We hit a snag</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Something went <span className="italic font-light">sideways.</span>
        </h1>
        <p className="mt-6 text-olive-800/85 leading-relaxed">{message}</p>
        {reference && (
          <p className="mt-2 text-sm text-olive-600 tabular">Reference: {reference}</p>
        )}
        <div className="mt-8 flex items-center gap-3">
          <Link href="/hire/details" className="btn btn-secondary">Back to details</Link>
          <Link href="/about/contact" className="btn">Talk to the studio</Link>
        </div>
      </div>
    </BookingShell>
  );
}
