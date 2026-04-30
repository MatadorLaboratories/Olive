"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { transitionBookingStatus, toggleAdminOverride } from "@/services/admin/booking-actions";
import type { BookingStatus } from "@/types/domain";

const STATUSES: BookingStatus[] = [
  "enquiry", "quoted", "deposit_pending", "confirmed", "final_pending",
  "final_paid", "packed", "delivered", "returned", "completed", "cancelled",
];

export function BookingStatusControls({
  bookingId,
  currentStatus,
  override,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
  override: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onChangeStatus = (status: BookingStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await transitionBookingStatus(bookingId, status);
      if (!result.ok) setError(result.error ?? "Couldn't update.");
      router.refresh();
    });
  };

  const onToggleOverride = (next: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await toggleAdminOverride(bookingId, next);
      if (!result.ok) setError(result.error ?? "Couldn't update.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow text-olive-600 mb-3">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => onChangeStatus(s)}
              className={cn(
                "px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-[0.12em] transition-colors",
                s === currentStatus
                  ? "bg-olive-900 text-cream-50 border-olive-900"
                  : "border-[color:var(--color-rule)] text-olive-700 hover:border-olive-700",
                pending && "opacity-60",
              )}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[color:var(--color-rule-soft)] pt-5">
        <p className="eyebrow text-olive-600 mb-2">30-day lock override</p>
        <p className="text-sm text-olive-700/85 leading-relaxed mb-3">
          Toggle on to allow the client to edit this booking inside the 30-day window.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => onToggleOverride(!override)}
          className={cn(
            "btn !py-3 !text-[12px]",
            override ? "btn-clay" : "btn-secondary",
            pending && "opacity-70",
          )}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />}
          {override ? "Override is on" : "Enable override"}
        </button>
      </div>

      {error && <p className="text-sm text-clay-600 italic">{error}</p>}
    </div>
  );
}
