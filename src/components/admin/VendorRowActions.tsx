"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Pause } from "lucide-react";
import { cn } from "@/lib/cn";
import { approveVendor, rejectVendor, suspendVendor } from "@/services/admin/vendor-actions";

const TIERS = [
  { tier: "Trade-10", pct: 10 },
  { tier: "Trade-15", pct: 15 },
  { tier: "Trade-20", pct: 20 },
];

export function VendorRowActions({
  vendorId,
  status,
}: {
  vendorId: string;
  status: "applied" | "in_review" | "approved" | "suspended" | "rejected";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openTier, setOpenTier] = useState(false);

  const onApprove = (tier: string, pct: number) => {
    startTransition(async () => {
      await approveVendor(vendorId, pct, tier);
      router.refresh();
      setOpenTier(false);
    });
  };

  const onReject = () => {
    startTransition(async () => {
      await rejectVendor(vendorId);
      router.refresh();
    });
  };

  const onSuspend = () => {
    startTransition(async () => {
      await suspendVendor(vendorId);
      router.refresh();
    });
  };

  if (status === "approved") {
    return (
      <button
        type="button"
        onClick={onSuspend}
        disabled={pending}
        className={cn("inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-clay-700 hover:text-clay-500", pending && "opacity-60")}
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3" strokeWidth={1.5} />}
        Suspend
      </button>
    );
  }

  if (status === "rejected" || status === "suspended") {
    return (
      <button
        type="button"
        onClick={() => setOpenTier(true)}
        className="text-[11px] uppercase tracking-[0.12em] text-olive-700 hover:text-clay-500"
      >
        Re-approve
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 relative">
      <button
        type="button"
        onClick={() => setOpenTier((v) => !v)}
        disabled={pending}
        className={cn("inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-olive-700 hover:text-clay-500", pending && "opacity-60")}
      >
        <Check className="h-3 w-3" strokeWidth={1.5} />
        Approve
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-olive-500 hover:text-clay-500"
      >
        <X className="h-3 w-3" strokeWidth={1.5} />
        Reject
      </button>

      {openTier && (
        <div className="absolute z-20 right-0 top-6 w-56 card p-3 shadow-lift">
          <p className="eyebrow text-olive-600 mb-2 px-1">Pick discount tier</p>
          {TIERS.map((t) => (
            <button
              key={t.tier}
              type="button"
              onClick={() => onApprove(t.tier, t.pct)}
              disabled={pending}
              className="w-full px-3 py-2 text-left rounded-md hover:bg-cream-100 text-sm text-olive-800 flex items-center justify-between"
            >
              <span>{t.tier}</span>
              <span className="text-clay-500 tabular">−{t.pct}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
