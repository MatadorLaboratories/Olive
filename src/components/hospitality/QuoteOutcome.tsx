"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Sparkles,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { ComputedQuote } from "@/services/custom-order-pricing";

/**
 * Builder outcome screen — replaces the old "Sent" thank-you with a real
 * proposal-style quote and three concrete actions:
 *
 *   1. Pay deposit (50%) now.
 *   2. Pay in full now.
 *   3. Save the quote (lands them in the dashboard / documents area).
 *
 * Anonymous submitters see the same quote but the pay buttons funnel
 * through `/login` — `?next=` carries them straight back to the pay page,
 * `?email=` pre-fills the form, and the auto-claim on login attaches the
 * quote to their new account by `contact_email`.
 *
 * If the auto-quoter couldn't produce a number (specialty edge, missing
 * tier price), the screen falls back to a clear "studio will quote" state
 * with the reference visible.
 */
export function QuoteOutcome({
  reference,
  loggedIn,
  contactName,
  contactEmail,
  quote,
  buildSummary,
}: {
  reference: string;
  loggedIn: boolean;
  contactName: string;
  contactEmail: string;
  quote: ComputedQuote;
  buildSummary: { label: string; value: string }[];
}) {
  const firstName = contactName.split(" ")[0] ?? "";

  const orderHref = loggedIn ? `/account/custom-orders/${reference}` : null;
  const payDepositHref = loggedIn
    ? `/account/custom-orders/${reference}/pay?mode=deposit`
    : `/login?next=${encodeURIComponent(`/account/custom-orders/${reference}/pay?mode=deposit`)}&email=${encodeURIComponent(contactEmail)}`;
  const payFullHref = loggedIn
    ? `/account/custom-orders/${reference}/pay?mode=full`
    : `/login?next=${encodeURIComponent(`/account/custom-orders/${reference}/pay?mode=full`)}&email=${encodeURIComponent(contactEmail)}`;
  const saveQuoteHref = loggedIn
    ? `/account/documents`
    : `/signup?next=${encodeURIComponent(`/account/custom-orders/${reference}`)}&email=${encodeURIComponent(contactEmail)}`;

  // ---------- unpriceable fallback ----------
  if (!quote.ok) {
    return (
      <section className="bg-canvas py-20 lg:py-28">
        <div className="shell-narrow text-center">
          <p className="eyebrow text-clay-500 mb-5">Sent</p>
          <h1 className="font-display text-display-xl text-olive-900 leading-[0.96]">
            Thanks{firstName ? `, ${firstName}` : ""}.{" "}
            <span className="italic font-light">We'll quote it by hand.</span>
          </h1>
          <p className="mt-6 text-[12px] uppercase tracking-[0.16em] text-olive-600">
            Reference{" "}
            <span className="text-olive-900 tabular">{reference}</span>
          </p>
          <p className="mt-6 text-olive-800/85 text-lg leading-relaxed max-w-lg mx-auto">
            {quote.unpriceableReason ??
              "We'll come back with a written quote within one business day."}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {loggedIn ? (
              <Link href={`/account/custom-orders/${reference}`} className="btn">
                Track your order
              </Link>
            ) : (
              <Link
                href={`/signup?next=${encodeURIComponent(`/account/custom-orders/${reference}`)}&email=${encodeURIComponent(contactEmail)}`}
                className="btn"
              >
                Create account to track it
              </Link>
            )}
            <Link href="/portfolio" className="btn btn-secondary">
              Browse the portfolio
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const depositCents = Math.round(quote.totalCents * 0.5);

  return (
    <section className="bg-canvas py-16 lg:py-20">
      <div className="shell">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left — proposal */}
          <div className="lg:col-span-7 space-y-10">
            <header>
              <p className="eyebrow text-clay-500 mb-4">Your quote · {reference}</p>
              <h1 className="font-display text-display-lg text-olive-900 leading-[1]">
                {firstName ? `Here's the quote, ${firstName}.` : "Here's your quote."}{" "}
                <span className="italic font-light">It's ready to confirm.</span>
              </h1>
              <p className="mt-5 text-olive-800/85 text-lg max-w-xl leading-relaxed">
                Pay the 50% deposit to lock the slot and we start production. Or pay in
                full and skip straight to the queue. Either way, you can come back to
                this quote anytime from your dashboard.
              </p>
            </header>

            {/* Build line — quick recap */}
            <section className="card p-7">
              <p className="eyebrow text-clay-500 mb-5">Build</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {buildSummary.map((row) => (
                  <div key={row.label}>
                    <dt className="eyebrow text-olive-500 mb-1">{row.label}</dt>
                    <dd className="text-olive-800 capitalize">{row.value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Quote breakdown */}
            <section className="card p-7">
              <p className="eyebrow text-clay-500 mb-5">Quote</p>
              <ul className="divide-y divide-[color:var(--border-hairline)]">
                {quote.lineItems.map((line, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-12 gap-3 py-3 items-baseline"
                  >
                    <div className="col-span-8">
                      <p className="text-olive-800">{line.label}</p>
                      {line.hint && (
                        <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-olive-500">
                          {line.hint}
                        </p>
                      )}
                    </div>
                    <p className="col-span-4 text-right font-display text-lg text-olive-900 tabular">
                      {formatMoney(line.amountCents)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-5 border-t border-[color:var(--border-base)] grid grid-cols-12 gap-3 items-baseline">
                <p className="col-span-8 eyebrow text-olive-700">
                  Total{quote.isIndicative ? " (indicative)" : ""}
                </p>
                <p className="col-span-4 text-right font-display text-3xl text-olive-900 tabular leading-none">
                  {formatMoney(quote.totalCents)}
                </p>
              </div>

              {quote.isIndicative && (
                <p className="mt-4 text-[12px] text-olive-600 leading-relaxed">
                  This is a "from" price based on the tier floor — the studio will
                  confirm the exact total against your actual quantity before despatch.
                </p>
              )}
            </section>

            {/* What happens next — editorial reassurance */}
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Bullet
                icon={CheckCircle2}
                title="Production locks"
                body="On payment, the studio is briefed and your slot is confirmed."
              />
              <Bullet
                icon={Sparkles}
                title="One business day"
                body="The studio replies with timeline, despatch and any custom-edge specifics."
              />
              <Bullet
                icon={FileText}
                title="Saved in your account"
                body="The quote sits in your dashboard documents — pay any remaining balance whenever."
              />
            </ul>
          </div>

          {/* Right — pay panel */}
          <aside className="lg:col-span-5 lg:sticky lg:top-28 self-start">
            <div className="card p-7 space-y-4">
              <p className="eyebrow text-clay-500">Choose how to pay</p>

              <Link
                href={payDepositHref}
                className="group block rounded-md border border-olive-900 bg-cream-50 p-5 hover:bg-olive-50 transition-colors"
              >
                <div className="flex items-baseline justify-between">
                  <p className="eyebrow text-olive-600">Deposit · 50%</p>
                  <ArrowRight
                    className="h-3.5 w-3.5 text-olive-700 group-hover:text-clay-600 transition-colors"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </div>
                <p className="mt-2 font-display text-3xl text-olive-900 tabular leading-none">
                  {formatMoney(depositCents)}
                </p>
                <p className="mt-3 text-[13px] text-olive-700 leading-relaxed">
                  Locks production. We invoice the balance once your napkins are ready
                  to despatch.
                </p>
              </Link>

              <Link
                href={payFullHref}
                className="group block rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-5 hover:border-olive-700 transition-colors"
              >
                <div className="flex items-baseline justify-between">
                  <p className="eyebrow text-olive-600">Pay in full</p>
                  <ArrowRight
                    className="h-3.5 w-3.5 text-olive-700 group-hover:text-clay-600 transition-colors"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </div>
                <p className="mt-2 font-display text-3xl text-olive-900 tabular leading-none">
                  {formatMoney(quote.totalCents)}
                </p>
                <p className="mt-3 text-[13px] text-olive-700 leading-relaxed">
                  Settle the whole quote now and skip straight into production.
                </p>
              </Link>

              <div className="pt-2 flex items-center justify-between">
                <Link
                  href={saveQuoteHref}
                  className="text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
                >
                  {loggedIn ? "Save & view in dashboard" : "Create account to save"}
                </Link>
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-olive-500">
                  <CreditCard className="h-3 w-3" strokeWidth={1.5} />
                  Stripe
                </span>
              </div>
            </div>

            {!loggedIn && (
              <p className="mt-4 text-[12px] text-olive-600 leading-relaxed">
                We'll attach this quote to your account when you sign in or sign up
                with <span className="text-olive-800">{contactEmail}</span> — no
                lost paperwork.
              </p>
            )}

            {orderHref && (
              <div className="mt-4 text-center">
                <Link
                  href={orderHref}
                  className="text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
                >
                  Open the order detail →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

function Bullet({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-md border border-[color:var(--border-hairline)] p-5 bg-[color:var(--color-paper)]">
      <Icon className="h-4 w-4 text-clay-500 mb-3" strokeWidth={1.5} aria-hidden />
      <p className="font-display text-lg text-olive-900 leading-tight">{title}</p>
      <p className="mt-2 text-[13px] text-olive-700 leading-relaxed">{body}</p>
    </li>
  );
}
