/**
 * Formatting utilities — money, dates, counts.
 *
 * Money is stored in cents (integer NZD) throughout the system.
 * UI-side helpers convert to strings; never do float math on prices.
 */

const NZD = new Intl.NumberFormat("en-NZ", {
  style: "currency",
  currency: "NZD",
  maximumFractionDigits: 0,
});

const NZD_PRECISE = new Intl.NumberFormat("en-NZ", {
  style: "currency",
  currency: "NZD",
  minimumFractionDigits: 2,
});

export function formatMoney(cents: number, opts: { precise?: boolean } = {}): string {
  const dollars = cents / 100;
  return opts.precise ? NZD_PRECISE.format(dollars) : NZD.format(dollars);
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
