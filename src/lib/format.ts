/**
 * Formatting utilities — money, dates, counts.
 *
 * Money is stored in cents (integer NZD) throughout the system.
 * UI-side helpers convert to strings; never do float math on prices.
 */

const NZD_WHOLE = new Intl.NumberFormat("en-NZ", {
  style: "currency",
  currency: "NZD",
  maximumFractionDigits: 0,
});

const NZD_PRECISE = new Intl.NumberFormat("en-NZ", {
  style: "currency",
  currency: "NZD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a money amount stored in cents.
 *
 * Default behaviour:
 *   - whole-dollar amounts render with no decimal: "$1,420"
 *   - fractional amounts render with two decimals: "$3.50"
 *
 * `{ precise: true }` forces 2dp regardless. `{ whole: true }` forces the
 * older whole-dollar truncation if a surface explicitly wants it.
 */
export function formatMoney(
  cents: number,
  opts: { precise?: boolean; whole?: boolean } = {},
): string {
  const dollars = cents / 100;
  if (opts.precise) return NZD_PRECISE.format(dollars);
  if (opts.whole) return NZD_WHOLE.format(dollars);
  // Auto: whole when amount is whole, else 2dp.
  return Number.isInteger(dollars) ? NZD_WHOLE.format(dollars) : NZD_PRECISE.format(dollars);
}

export function formatMoneyRange(minCents: number, maxCents: number): string {
  if (minCents === maxCents) return formatMoney(minCents);
  return `${formatMoney(minCents)} – ${formatMoney(maxCents)}`;
}

const DATE_LONG = new Intl.DateTimeFormat("en-NZ", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATE_SHORT = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_RANGE = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
});

export function formatDate(d: Date | string, variant: "long" | "short" = "short"): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return (variant === "long" ? DATE_LONG : DATE_SHORT).format(date);
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${DATE_RANGE.format(s)} – ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${DATE_RANGE.format(s)} – ${DATE_RANGE.format(e)}, ${e.getFullYear()}`;
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? singular : (plural ?? `${singular}s`);
}
