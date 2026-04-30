"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { updateDraftQuantity } from "@/services/booking-actions";

/**
 * Quantity stepper for the booking products step.
 *
 * Optimistic UI — the local state updates immediately; the server action
 * runs in a transition and refreshes the surrounding RSC tree. If the user
 * stepps faster than the action returns, we coalesce the latest value.
 */
export function QuantityStepper({
  productId,
  initial,
  max,
  step = 1,
}: {
  productId: string;
  initial: number;
  max: number;
  step?: number;
}) {
  const [qty, setQty] = useState(initial);
  const [pending, startTransition] = useTransition();
  // If the parent re-renders with a new initial (e.g. after navigation), sync.
  useEffect(() => setQty(initial), [initial]);

  const update = (next: number) => {
    const clamped = Math.max(0, Math.min(max, next));
    setQty(clamped);
    startTransition(async () => {
      await updateDraftQuantity(productId, clamped);
    });
  };

  const atMin = qty === 0;
  const atMax = qty >= max;

  return (
    <div className="flex items-center">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={atMin || pending}
        onClick={() => update(qty - step)}
        className={cn(
          "h-9 w-9 grid place-items-center rounded-l-full border border-r-0 transition-colors",
          atMin
            ? "border-[color:var(--color-rule-soft)] text-olive-300 cursor-not-allowed"
            : "border-[color:var(--color-rule)] text-olive-800 hover:bg-cream-100",
        )}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      <div
        className={cn(
          "h-9 min-w-[3rem] px-3 grid place-items-center border bg-cream-50 tabular text-sm",
          qty > 0 ? "border-olive-700 text-olive-900" : "border-[color:var(--color-rule)] text-olive-500",
        )}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : qty}
      </div>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={atMax || pending}
        onClick={() => update(qty + step)}
        className={cn(
          "h-9 w-9 grid place-items-center rounded-r-full border border-l-0 transition-colors",
          atMax
            ? "border-[color:var(--color-rule-soft)] text-olive-300 cursor-not-allowed"
            : "border-[color:var(--color-rule)] text-olive-800 hover:bg-cream-100",
        )}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
