"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { sendMessageAction } from "@/services/messaging-actions";
import { sendAdminMessageAction } from "@/services/admin/messaging-actions";
import type { Message } from "@/services/messaging";

const formatTime = new Intl.DateTimeFormat("en-NZ", {
  hour: "numeric",
  minute: "2-digit",
  weekday: "short",
  day: "numeric",
  month: "short",
});

export type MessageThreadViewer = "client" | "studio";

/**
 * Booking / custom-order message thread.
 *
 * The same component renders on both sides of the conversation. The `viewer`
 * prop swaps the composer copy, the sender label on incoming messages, and
 * the bubble alignment.
 *
 * Anchor: a thread is identified either by a `bookingReference` (client / vendor
 * portal) or a `threadId` (admin inbox). Whichever is provided drives which
 * server action is called on send.
 */
export function MessageThread({
  bookingReference,
  threadId,
  initial,
  viewer = "client",
  emptyHint,
}: {
  /** Client/vendor surface — sends through `sendMessageAction(reference)`. */
  bookingReference?: string;
  /** Admin surface — sends through `sendAdminMessageAction(threadId)`. */
  threadId?: string;
  initial: Message[];
  viewer?: MessageThreadViewer;
  emptyHint?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");

  const composerPlaceholder =
    viewer === "studio"
      ? "Reply as the studio…"
      : "Write to the studio…";

  const ctaLabel = viewer === "studio" ? "Send reply" : "Send";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);

    startTransition(async () => {
      const result =
        viewer === "studio" && threadId
          ? await sendAdminMessageAction({ threadId, body })
          : bookingReference
            ? await sendMessageAction({ bookingReference, body })
            : ({ ok: false, error: "Missing thread context." } as const);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <ul className="space-y-5">
        {initial.length === 0 ? (
          <li className="card p-8 text-center font-display italic text-olive-600 text-xl">
            {emptyHint ??
              (viewer === "studio"
                ? "No messages yet — open the conversation."
                : "Say hello — we'll always reply.")}
          </li>
        ) : (
          initial.map((m) => {
            const fromStudio =
              m.senderRole === "admin" || m.senderRole === "staff";
            // Bubble alignment: viewer's own messages on the right, the other
            // party's messages on the left, regardless of which side is open.
            const isOwn =
              (viewer === "studio" && fromStudio) ||
              (viewer === "client" && !fromStudio);

            const senderLabel = fromStudio
              ? "The studio"
              : viewer === "studio"
                ? (m.senderName ?? "Client")
                : (m.senderName ?? "You");

            return (
              <li
                key={m.id}
                className={cn(
                  "max-w-[85%] sm:max-w-[75%] rounded-lg p-5",
                  fromStudio
                    ? "bg-olive-900 text-cream-100"
                    : "bg-cream-50 text-olive-900 border border-[color:var(--border-hairline)]",
                  isOwn ? "ml-auto" : "mr-auto",
                )}
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span
                    className={cn(
                      "text-[11px] uppercase tracking-[0.14em] font-medium",
                      fromStudio ? "text-clay-300" : "text-clay-500",
                    )}
                  >
                    {senderLabel}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] tabular",
                      fromStudio ? "text-cream-100/55" : "text-olive-500",
                    )}
                  >
                    {formatTime.format(new Date(m.createdAt))}
                  </span>
                </div>
                <p
                  className={cn(
                    "leading-relaxed whitespace-pre-line",
                    fromStudio ? "text-cream-100/95" : "text-olive-800",
                  )}
                >
                  {m.body}
                </p>
              </li>
            );
          })
        )}
      </ul>

      {/* Composer */}
      <form onSubmit={onSubmit} className="card p-5">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={composerPlaceholder}
          className="field-textarea !border-transparent !bg-transparent !p-0 focus:!border-transparent resize-none"
        />
        {error && <p className="mt-2 text-sm text-clay-600 italic">{error}</p>}
        <div className="mt-3 flex items-center justify-end">
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className={cn(
              "btn !py-2.5 !text-[12px]",
              (pending || !body.trim()) && "opacity-60",
            )}
          >
            {pending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" strokeWidth={1.5} />
            )}
            {ctaLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
