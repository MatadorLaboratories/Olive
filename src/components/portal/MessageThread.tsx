"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { sendMessageAction } from "@/services/messaging-actions";
import type { Message } from "@/services/messaging";

const formatTime = new Intl.DateTimeFormat("en-NZ", {
  hour: "numeric",
  minute: "2-digit",
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function MessageThread({
  bookingReference,
  initial,
}: {
  bookingReference: string;
  initial: Message[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await sendMessageAction({ bookingReference, body });
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
            Say hello — we'll always reply.
          </li>
        ) : (
          initial.map((m) => {
            const fromStudio = m.senderRole === "admin" || m.senderRole === "staff";
            return (
              <li
                key={m.id}
                className={cn(
                  "max-w-[85%] sm:max-w-[75%] rounded-lg p-5",
                  fromStudio
                    ? "bg-olive-900 text-cream-100 self-start"
                    : "bg-cream-50 text-olive-900 ml-auto border border-[color:var(--color-rule-soft)]",
                )}
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span
                    className={cn(
                      "text-[11px] uppercase tracking-[0.14em] font-medium",
                      fromStudio ? "text-clay-300" : "text-clay-500",
                    )}
                  >
                    {fromStudio ? "The studio" : m.senderName ?? "You"}
                  </span>
                  <span className={cn("text-[11px] tabular", fromStudio ? "text-cream-100/55" : "text-olive-500")}>
                    {formatTime.format(new Date(m.createdAt))}
                  </span>
                </div>
                <p className={cn("leading-relaxed whitespace-pre-line", fromStudio ? "text-cream-100/95" : "text-olive-800")}>
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
          placeholder="Write to the studio…"
          className="field-textarea !border-transparent !bg-transparent !p-0 focus:!border-transparent resize-none"
        />
        {error && <p className="mt-2 text-sm text-clay-600 italic">{error}</p>}
        <div className="mt-3 flex items-center justify-end">
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className={cn("btn btn-clay !py-2.5 !text-[12px]", (pending || !body.trim()) && "opacity-60")}
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" strokeWidth={1.5} />}
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
