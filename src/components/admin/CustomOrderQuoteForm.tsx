"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { saveCustomOrderQuote } from "@/services/admin/custom-order-actions";
import type { CustomOrderStatus } from "@/types/domain";

const STATUSES: Array<{ id: CustomOrderStatus; label: string }> = [
  { id: "new_request", label: "New request" },
  { id: "awaiting_quote", label: "Awaiting quote" },
  { id: "quote_sent", label: "Quote sent" },
  { id: "deposit_paid", label: "Deposit paid" },
  { id: "in_production", label: "In production" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

/**
 * Editor for an admin to set the quote total + status + internal notes on
 * a custom order. When status flips to `quote_sent`, the server action
 * fires the customer email automatically.
 */
export function CustomOrderQuoteForm({
  id,
  reference,
  initialQuoteTotalCents,
  initialStatus,
  initialInternalNotes,
}: {
  id: string;
  reference: string;
  initialQuoteTotalCents: number | null;
  initialStatus: CustomOrderStatus;
  initialInternalNotes: string | null;
}) {
  const [quoteDollars, setQuoteDollars] = useState<string>(
    initialQuoteTotalCents != null
      ? (initialQuoteTotalCents / 100).toString()
      : "",
  );
  const [status, setStatus] = useState<CustomOrderStatus>(initialStatus);
  const [notes, setNotes] = useState<string>(initialInternalNotes ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedAt(null);
    const parsed = quoteDollars.trim() === "" ? null : Number(quoteDollars);
    if (parsed != null && Number.isNaN(parsed)) {
      setError("Quote needs to be a number.");
      return;
    }
    const cents = parsed != null ? Math.round(parsed * 100) : null;
    startTransition(async () => {
      const result = await saveCustomOrderQuote({
        id,
        reference,
        quoteTotalCents: cents,
        status,
        internalNotes: notes.trim() === "" ? null : notes,
      });
      if (!result.ok) {
        setError(result.error ?? "Couldn't save.");
        return;
      }
      setSavedAt(Date.now());
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Quote total (NZD)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={quoteDollars}
            onChange={(e) => setQuoteDollars(e.target.value)}
            className="field-input"
            placeholder="e.g. 3180.00"
          />
        </div>
        <div>
          <label className="field-label">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CustomOrderStatus)}
            className="field-select"
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label">Internal notes</label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Studio-only notes — fabric source, embroidery vendor, expected ship date…"
          className="field-textarea"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={cn("btn", pending && "opacity-70")}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          {status === "quote_sent" ? "Save & send quote" : "Save"}
        </button>
        {error && <p className="text-sm text-clay-600 italic">{error}</p>}
        {savedAt && !error && (
          <p className="text-sm text-olive-700 italic">Saved.</p>
        )}
      </div>

      <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
        Setting the status to <em className="not-italic font-display">Quote sent</em> emails the customer the portal pay link.
      </p>
    </form>
  );
}
