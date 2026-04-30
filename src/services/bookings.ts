import "server-only";
import { differenceInCalendarDays, parseISO, subDays } from "date-fns";

/**
 * Booking domain service.
 *
 * Concerns:
 *  - reference generation (OLV-1042 format)
 *  - 30-day cutoff logic
 *  - deposit / final-due totals
 *  - status transitions
 *
 * Phase 1 ships the pure-function building blocks; Phase 2 wires them
 * into the booking flow's server action.
 */

export const DEPOSIT_PCT = 0.5;
export const CUTOFF_DAYS = 30;

/** Format an integer reference to `OLV-####`. Sequence is generated DB-side. */
export function formatBookingReference(seq: number): string {
  return `OLV-${seq.toString().padStart(4, "0")}`;
}

/** Calculate deposit due (cents) — half the total, rounded. */
export function depositDueCents(totalCents: number): number {
  return Math.round(totalCents * DEPOSIT_PCT);
}

/** Calculate final balance due (cents). */
export function finalDueCents(totalCents: number, depositPaidCents: number): number {
  return Math.max(0, totalCents - depositPaidCents);
}

/** Compute the date 30 days before the event — when final balance is due. */
export function finalDueDate(eventDateISO: string): string {
  const event = parseISO(eventDateISO);
  return subDays(event, CUTOFF_DAYS).toISOString().slice(0, 10);
}

/** Is `today` inside the 30-day cutoff window for the given event? */
export function isInsideCutoff(eventDateISO: string, today = new Date()): boolean {
  return differenceInCalendarDays(parseISO(eventDateISO), today) <= CUTOFF_DAYS;
}

/** Reminder ramp: cents owing × dates. */
export function reminderSchedule(eventDateISO: string): Array<{ at: string; label: string }> {
  const event = parseISO(eventDateISO);
  return [
    { at: subDays(event, 35).toISOString().slice(0, 10), label: "5-day warning before final balance is due" },
    { at: subDays(event, 30).toISOString().slice(0, 10), label: "Final balance due — 30-day rule kicks in" },
    { at: subDays(event, 14).toISOString().slice(0, 10), label: "Soft reminder — confirm timeline & details" },
    { at: subDays(event, 7).toISOString().slice(0, 10),  label: "Final reminder before event week" },
  ];
}
