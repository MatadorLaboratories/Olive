import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { getAdminThreadList } from "@/services/admin/messaging";

const formatTime = new Intl.DateTimeFormat("en-NZ", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminMessagesIndex() {
  const threads = await getAdminThreadList();
  const needsReply = threads.filter((t) => t.needsReply);

  return (
    <div className="space-y-10 max-w-5xl">
      <PageHeader
        eyebrow="Messages"
        title={
          <>
            Studio inbox.{" "}
            {needsReply.length > 0 && (
              <span className="italic font-light text-olive-700/85">
                {needsReply.length} waiting for a reply.
              </span>
            )}
          </>
        }
        description="Booking and custom-order conversations, newest activity first. Threads without a recent studio reply are surfaced at the top."
      />

      {threads.length === 0 ? (
        <div className="card p-14 text-center">
          <Inbox
            className="h-6 w-6 mx-auto text-olive-400"
            strokeWidth={1.5}
          />
          <p className="font-display italic text-olive-700 text-2xl mt-4">
            No conversations yet.
          </p>
          <p className="mt-2 text-sm text-olive-600">
            Threads open the moment a client or vendor writes in.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--border-hairline)] border-y border-[color:var(--border-hairline)]">
          {threads.map((t) => {
            const previewBody = t.lastMessage?.body ?? "";
            const previewTime = t.lastMessage?.createdAt
              ? formatTime.format(new Date(t.lastMessage.createdAt))
              : "";
            const senderName =
              t.lastMessage?.senderRole === "admin" ||
              t.lastMessage?.senderRole === "staff"
                ? "The studio"
                : (t.lastMessage?.senderName ?? t.counterpartName ?? "Client");

            return (
              <li key={t.threadId}>
                <Link
                  href={`/admin/messages/${t.threadId}`}
                  className="grid grid-cols-12 items-center gap-4 py-5 group hover:bg-[color:var(--color-paper)] -mx-3 px-3 rounded-md transition-colors"
                >
                  <div className="col-span-12 md:col-span-4 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg text-olive-900 truncate">
                        {t.counterpartName ?? "Conversation"}
                      </span>
                      {t.needsReply && (
                        <span className="pill border-clay-300 text-clay-700 bg-clay-50">
                          Reply
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-olive-500 tabular truncate">
                      {t.reference ?? t.subject ?? t.kind}
                      {t.kind === "custom_order" && (
                        <span className="text-olive-400"> · custom order</span>
                      )}
                    </p>
                  </div>

                  <div className="col-span-9 md:col-span-6 min-w-0 text-sm text-olive-700">
                    {previewBody ? (
                      <span className="line-clamp-2 leading-snug">
                        <span className="text-olive-500 mr-2">
                          {senderName}:
                        </span>
                        {previewBody}
                      </span>
                    ) : (
                      <span className="italic text-olive-500">
                        Empty thread — open to start.
                      </span>
                    )}
                  </div>

                  <div className="col-span-3 md:col-span-2 text-right">
                    <p className="text-[11px] tabular text-olive-500">
                      {previewTime}
                    </p>
                    <ArrowRight
                      className="inline-block mt-2 h-3.5 w-3.5 text-olive-500 group-hover:text-clay-600 transition-colors"
                      strokeWidth={1.5}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
