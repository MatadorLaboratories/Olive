"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { createCustomOrderPaymentIntent } from "@/services/custom-orders-pay";
import { StripePaymentForm } from "@/components/booking/StripePaymentForm";

type Mode = "deposit" | "full";

/**
 * Client orchestrator for the custom-order payment flow.
 *
 * - User chooses Mode (deposit / full).
 * - On confirm, calls `createCustomOrderPaymentIntent` server action.
 * - On success, swaps the picker for the role-aware Stripe `PaymentElement`
 *   wrapped by the existing `StripePaymentForm`. We pass a custom
 *   `returnPath` so Stripe redirects back to the custom-order
 *   confirmation page rather than the booking one.
 *
 * Demo mode (no Supabase or no Stripe) renders a graceful "demo" notice
 * instead of opening a real payment.
 */
export function CustomOrderPay({
  reference,
  outstandingCents,
  depositRemainingCents,
  depositAvailable,
  initialMode,
}: {
  reference: string;
  outstandingCents: number;
  depositRemainingCents: number;
  depositAvailable: boolean;
  /** Pre-selected mode from a deep-link (?mode=deposit|full). */
  initialMode?: Mode;
}) {
  // Honour the deep-link mode when valid against the order's state — fall
  // back to whichever option is actually meaningful right now.
  const defaultMode: Mode =
    initialMode === "deposit" && depositAvailable
      ? "deposit"
      : initialMode === "full"
        ? "full"
        : depositAvailable
          ? "deposit"
          : "full";
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<
    | null
    | {
        clientSecret: string | null;
        amountCents: number;
        mode: Mode;
        demo: boolean;
      }
  >(null);

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCustomOrderPaymentIntent(reference, mode);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.demo) {
        setIntent({
          clientSecret: null,
          amountCents: result.amountCents,
          mode: result.mode,
          demo: true,
        });
        return;
      }
      setIntent({
        clientSecret: result.clientSecret,
        amountCents: result.amountCents,
        mode: result.mode,
        demo: false,
      });
    });
  };

  // Already opened a real intent — render Stripe.
  if (intent && intent.clientSecret) {
    return (
      <section className="card p-7 sm:p-9 space-y-6">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow text-clay-500">
            {intent.mode === "deposit" ? "Deposit · 50%" : "Pay in full"}
          </p>
          <p className="font-display text-2xl text-olive-900 tabular">
            {formatMoney(intent.amountCents)}
          </p>
        </div>
        <StripePaymentForm
          clientSecret={intent.clientSecret}
          reference={reference}
          returnPath={`/account/custom-orders/${reference}/confirmation`}
          ctaLabel={intent.mode === "deposit" ? "Pay deposit" : "Pay in full"}
        />
      </section>
    );
  }

  // Demo mode — show what would happen without Stripe wired up.
  if (intent && intent.demo) {
    return (
      <section className="card p-7 sm:p-9 space-y-4">
        <p className="eyebrow text-clay-500">Demo mode</p>
        <p className="font-display text-2xl text-olive-900 italic font-light leading-snug">
          Stripe isn't connected in this environment.
        </p>
        <p className="text-olive-800/85 leading-relaxed">
          We'd charge{" "}
          <span className="tabular text-olive-900">
            {formatMoney(intent.amountCents)}
          </span>{" "}
          ({intent.mode === "deposit" ? "50% deposit" : "full balance"}) here.
          Connect Stripe to enable live payments.
        </p>
      </section>
    );
  }

  // Picker — initial state.
  return (
    <section className="card p-7 sm:p-9 space-y-6">
      <p className="eyebrow text-clay-500">Choose how to pay</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {depositAvailable && (
          <button
            type="button"
            onClick={() => setMode("deposit")}
            className={cn(
              "rounded-md border p-5 text-left transition-colors",
              mode === "deposit"
                ? "border-olive-900 bg-cream-50"
                : "border-[color:var(--color-rule)] hover:border-olive-700",
            )}
          >
            <p className="eyebrow text-olive-600 mb-2">50% deposit</p>
            <p className="font-display text-3xl text-olive-900 tabular leading-none">
              {formatMoney(depositRemainingCents)}
            </p>
            <p className="mt-3 text-[13px] text-olive-700 leading-relaxed">
              Locks production. We'll invoice the balance once your napkins
              are ready to despatch.
            </p>
          </button>
        )}
        <button
          type="button"
          onClick={() => setMode("full")}
          className={cn(
            "rounded-md border p-5 text-left transition-colors",
            mode === "full"
              ? "border-olive-900 bg-cream-50"
              : "border-[color:var(--color-rule)] hover:border-olive-700",
            !depositAvailable && "sm:col-span-2",
          )}
        >
          <p className="eyebrow text-olive-600 mb-2">Pay in full</p>
          <p className="font-display text-3xl text-olive-900 tabular leading-none">
            {formatMoney(outstandingCents)}
          </p>
          <p className="mt-3 text-[13px] text-olive-700 leading-relaxed">
            Settle the whole quote now. We move you straight into production.
          </p>
        </button>
      </div>

      {error && (
        <p className="text-sm text-clay-600 italic" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={cn("btn", pending && "opacity-70")}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : null}
          Continue to payment
        </button>
        <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
          Card details handled by Stripe — never touch our servers.
        </p>
      </div>
    </section>
  );
}
