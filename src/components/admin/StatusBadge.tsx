import { cn } from "@/lib/cn";
import type { BookingStatus, CustomOrderStatus, VendorStatus } from "@/types/domain";

type Tone = "neutral" | "amber" | "clay" | "green" | "red" | "olive";

const BOOKING_TONE: Record<BookingStatus, Tone> = {
  enquiry:         "neutral",
  quoted:          "amber",
  deposit_pending: "amber",
  confirmed:       "green",
  final_pending:   "amber",
  final_paid:      "green",
  packed:          "olive",
  delivered:       "olive",
  returned:        "olive",
  completed:       "green",
  cancelled:       "red",
  archived:        "neutral",
};

const CUSTOM_TONE: Record<CustomOrderStatus, Tone> = {
  new_request:    "neutral",
  awaiting_quote: "amber",
  quote_sent:     "amber",
  deposit_paid:   "green",
  in_production:  "olive",
  ready:          "olive",
  completed:      "green",
  cancelled:      "red",
};

const VENDOR_TONE: Record<VendorStatus, Tone> = {
  applied:    "amber",
  in_review:  "amber",
  approved:   "green",
  suspended:  "red",
  rejected:   "red",
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-[color:var(--color-rule)] text-olive-700 bg-cream-50",
  amber:   "border-clay-300/80 text-clay-700 bg-clay-50",
  clay:    "border-clay-500 text-cream-50 bg-clay-500",
  green:   "border-olive-300 text-olive-700 bg-olive-50",
  olive:   "border-olive-700 text-cream-50 bg-olive-700",
  red:     "border-[#b03a2e]/40 text-[#7d281f] bg-[#b03a2e]/8",
};

export function StatusBadge({
  kind,
  value,
  className,
}: {
  kind: "booking" | "custom" | "vendor";
  value: string;
  className?: string;
}) {
  const tone: Tone =
    kind === "booking"
      ? BOOKING_TONE[value as BookingStatus] ?? "neutral"
      : kind === "custom"
        ? CUSTOM_TONE[value as CustomOrderStatus] ?? "neutral"
        : VENDOR_TONE[value as VendorStatus] ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium uppercase tracking-[0.12em]",
        TONE_CLASS[tone],
        className,
      )}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}
