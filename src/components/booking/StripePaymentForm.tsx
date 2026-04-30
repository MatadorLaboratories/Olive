"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

let _stripePromise: Promise<Stripe | null> | null = null;
function stripePromise() {
  if (_stripePromise) return _stripePromise;
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  _stripePromise = loadStripe(key);
  return _stripePromise;
}

/**
 * Stripe Payment Element — wraps the iframe-based card UI in our editorial styling.
 * Confirms the deposit PaymentIntent via the client_secret returned from the server.
 *
 * On success, redirects to /hire/confirmation?ref=…; the webhook will update the
 * booking status server-side.
 */
export function StripePaymentForm({
  clientSecret,
  reference,
}: {
  clientSecret: string;
  reference: string;
}) {
  return (
    <Elements
      stripe={stripePromise()}
      options={{
        clientSecret,
        appearance: {
          theme: "flat",
          variables: {
            fontFamily: 'Inter, system-ui, sans-serif',
            colorPrimary: "#c8541c",
            colorBackground: "#fbf8f1",
            colorText: "#1d2616",
            colorDanger: "#b03a2e",
            borderRadius: "4px",
            spacingUnit: "4px",
          },
          rules: {
            ".Input": { border: "1px solid rgba(45, 60, 30, 0.16)", padding: "14px 16px" },
            ".Label": {
              fontSize: "12px",
              fontWeight: "500",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#3d4b2d",
            },
          },
        },
      }}
    >
      <Inner reference={reference} />
    </Elements>
  );
}

function Inner({ reference }: { reference: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (stripe && elements) setReady(true);
  }, [stripe, elements]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPending(true);
    setError(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/hire/confirmation?ref=${reference}`,
      },
    });
    if (error) {
      setError(error.message ?? "Payment failed. Please try again.");
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className={cn(!ready && "opacity-50 pointer-events-none")}>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && <p className="text-sm text-clay-600 italic" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={!ready || pending}
        className={cn("btn btn-clay !py-4 w-full sm:w-auto", (!ready || pending) && "opacity-70")}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
        Pay deposit & confirm booking
      </button>

      <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
        Secured by Stripe — your card details never touch our servers.
      </p>
    </form>
  );
}
