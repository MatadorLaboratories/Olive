import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  CircleDot,
  Mail,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MessageThread } from "@/components/portal/MessageThread";
import { getAdminThreadDetail } from "@/services/admin/messaging";
import { formatDate, formatMoney } from "@/lib/format";

type Params = { threadId: string };

export default async function AdminMessageThreadPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { threadId } = await params;
  const thread = await getAdminThreadDetail(threadId);
  if (!thread) notFound();

  // Pass the messages to the role-aware MessageThread.
  const initial = thread.messages.map((m) => ({
    id: m.id,
    threadId: thread.threadId,
    senderId: m.senderId,
    senderName: m.senderName,
    senderRole: m.senderRole,
    body: m.body,
    createdAt: m.createdAt,
    attachments: m.attachments,
  }));

  const ctx = thread.contextSummary;

  return (
    <div className="space-y-10 max-w-7xl">
      <Link
        href="/admin/messages"
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Inbox
      </Link>

      <PageHeader
        eyebrow={
          thread.kind === "booking"
            ? `Booking · ${thread.reference ?? "—"}`
            : `Custom order · ${thread.reference ?? "—"}`
        }
        title={
          <>
            {thread.counterpartName ?? "Conversation"}
            {thread.subject && (
              <span className="block italic font-light text-olive-700/85 text-[0.7em] mt-2">
                {thread.subject}
              </span>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <MessageThread
            threadId={thread.threadId}
            viewer="studio"
            initial={initial}
            emptyHint={
              thread.kind === "custom_order"
                ? "No messages yet on this custom order — write the first reply to open the thread."
                : "No messages yet — open the conversation."
            }
          />
        </div>

        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-8 self-start">
          {/* Context */}
          <div className="card p-7">
            <p className="eyebrow text-clay-500 mb-4">Context</p>

            {ctx?.eventDate && (
              <Row
                icon={Calendar}
                label="Event date"
                value={formatDate(ctx.eventDate, "long")}
              />
            )}
            {ctx?.venue && (
              <Row icon={MapPin} label="Venue" value={ctx.venue} />
            )}
            {ctx?.status && (
              <div className="flex items-start gap-3 py-1.5">
                <CircleDot
                  className="h-4 w-4 text-olive-500 mt-0.5 shrink-0"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="eyebrow text-olive-600 mb-1">Status</p>
                  <StatusBadge
                    kind={thread.kind === "booking" ? "booking" : "custom"}
                    value={ctx.status}
                  />
                </div>
              </div>
            )}
            {typeof ctx?.totalCents === "number" && ctx.totalCents > 0 && (
              <Row
                label="Booking total"
                value={formatMoney(ctx.totalCents)}
                tabular
              />
            )}
            {ctx?.customerEmail && (
              <Row
                icon={Mail}
                label="Email"
                value={
                  <a
                    href={`mailto:${ctx.customerEmail}`}
                    className="lnk text-olive-800"
                  >
                    {ctx.customerEmail}
                  </a>
                }
              />
            )}

            {thread.contextHref && (
              <div className="mt-6 pt-5 border-t border-[color:var(--border-hairline)]">
                <Link
                  href={thread.contextHref}
                  className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
                >
                  Open{" "}
                  {thread.kind === "booking" ? "booking" : "custom order"}
                  <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  tabular,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: React.ReactNode;
  tabular?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      {Icon ? (
        <Icon
          className="h-4 w-4 text-olive-500 mt-0.5 shrink-0"
          strokeWidth={1.5}
        />
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="eyebrow text-olive-600 mb-1">{label}</p>
        <p
          className={`text-olive-800 leading-snug${tabular ? " tabular" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
