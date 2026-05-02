import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  CreditCard,
  FileText,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getCustomOrderForCurrentUser } from "@/services/custom-orders-read";
import { formatDate, formatMoney } from "@/lib/format";
import type { CustomOrderStatus } from "@/types/domain";

const TIMELINE_STAGES: Array<{ id: CustomOrderStatus; label: string }> = [
  { id: "new_request",    label: "Submitted" },
  { id: "awaiting_quote", label: "Quoting" },
  { id: "quote_sent",     label: "Quote sent" },
  { id: "deposit_paid",   label: "Deposit paid" },
  { id: "in_production",  label: "In production" },
  { id: "ready",          label: "Ready" },
  { id: "completed",      label: "Completed" },
];

type Params = { reference: string };

export default async function CustomOrderDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { reference } = await params;
  const order = await getCustomOrderForCurrentUser(reference);
  if (!order) notFound();

  const buildLine = [order.fabric, order.edgeStyle, order.colour]
    .filter(Boolean)
    .join(" · ");

  const quoteCents = order.quoteTotalCents ?? 0;
  const paidCents = order.totalPaidCents ?? 0;
  const outstanding = Math.max(0, quoteCents - paidCents);
  const hasQuote = quoteCents > 0;
  const isCancelled = order.status === "cancelled";
  const isComplete = order.status === "completed";

  // The pay page is meaningful only when we have a quote, balance to pay, and
  // the studio has reached "quote_sent" or beyond (without being cancelled).
  const canPay =
    hasQuote &&
    outstanding > 0 &&
    !isCancelled &&
    [
      "quote_sent",
      "deposit_paid",
      "in_production",
      "ready",
    ].includes(order.status);

  const stageIndex = TIMELINE_STAGES.findIndex((s) => s.id === order.status);

  return (
    <div className="space-y-12 max-w-6xl">
      <Link
        href="/account/custom-orders"
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Custom orders
      </Link>

      <header className="space-y-4">
        <p className="eyebrow">Custom order · {order.reference}</p>
        <h1 className="font-display text-display-lg text-olive-900 leading-[1]">
          {order.businessName ? (
            <>
              {order.businessName}
              <span className="block italic font-light text-olive-700/85 text-[0.55em] mt-3">
                {buildLine || "Custom napkins"}
              </span>
            </>
          ) : (
            <>
              Your custom <span className="italic font-light">napkins.</span>
            </>
          )}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge kind="custom" value={order.status} />
          {order.preferredDeadline && (
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-olive-600">
              <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} />
              Deadline {formatDate(order.preferredDeadline, "long")}
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left — main detail */}
        <div className="lg:col-span-8 space-y-10">
          {/* Pricing & payment */}
          <section className="card p-7 space-y-6">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow text-clay-500">Pricing</p>
              {hasQuote && (
                <span className="text-[11px] uppercase tracking-[0.16em] text-olive-600 inline-flex items-center gap-1.5">
                  <CreditCard className="h-3 w-3" strokeWidth={1.5} />
                  {outstanding === 0 ? "Paid in full" : "Balance due"}
                </span>
              )}
            </div>

            {hasQuote ? (
              <dl className="grid grid-cols-3 gap-6">
                <div>
                  <dt className="eyebrow text-olive-500 mb-1">Quote total</dt>
                  <dd className="font-display text-3xl text-olive-900 tabular leading-none">
                    {formatMoney(quoteCents)}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-olive-500 mb-1">Paid</dt>
                  <dd className="font-display text-3xl text-olive-900 tabular leading-none">
                    {formatMoney(paidCents)}
                  </dd>
                  {order.depositPaidCents > 0 && order.depositPaidCents < paidCents && (
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-olive-500">
                      incl. {formatMoney(order.depositPaidCents)} deposit
                    </p>
                  )}
                </div>
                <div>
                  <dt className="eyebrow text-olive-500 mb-1">Outstanding</dt>
                  <dd
                    className={
                      outstanding > 0
                        ? "font-display text-3xl text-clay-600 tabular leading-none"
                        : "font-display text-3xl text-olive-700 tabular leading-none"
                    }
                  >
                    {formatMoney(outstanding)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-olive-700 italic font-light text-lg leading-relaxed">
                We're putting together your written quote — usually within
                three business days. We'll email you when it's ready.
              </p>
            )}

            {canPay && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href={`/account/custom-orders/${order.reference}/pay`}
                  className="btn"
                >
                  <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {order.status === "quote_sent"
                    ? "Approve quote & pay"
                    : "Pay outstanding balance"}
                </Link>
                <span className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
                  Choose deposit or pay in full on the next step.
                </span>
              </div>
            )}

            {isComplete && paidCents >= quoteCents && (
              <p className="inline-flex items-center gap-2 text-[12px] text-olive-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-olive-700" strokeWidth={1.5} />
                Fully paid {order.paidAt ? `on ${formatDate(order.paidAt, "long")}` : ""}.
              </p>
            )}
          </section>

          {/* Timeline */}
          <section className="card p-7">
            <p className="eyebrow text-clay-500 mb-6">Where we are</p>
            <ol className="relative space-y-5">
              {TIMELINE_STAGES.map((stage, i) => {
                const reached = stageIndex >= i;
                const current = stageIndex === i;
                if (isCancelled) {
                  // Cancelled orders short-circuit the timeline entirely.
                  if (i > 0) return null;
                  return (
                    <li
                      key={stage.id}
                      className="flex items-start gap-4 text-clay-700"
                    >
                      <CircleDot
                        className="h-4 w-4 mt-0.5 shrink-0"
                        strokeWidth={1.5}
                      />
                      <div>
                        <p className="font-display text-lg italic font-light">
                          Cancelled
                        </p>
                        <p className="text-[12px] text-olive-600 mt-1">
                          This order is no longer active. Reach out if you'd
                          like to revive it.
                        </p>
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={stage.id} className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className={
                        reached
                          ? "mt-1.5 inline-block h-2 w-2 rounded-full bg-olive-700"
                          : "mt-1.5 inline-block h-2 w-2 rounded-full border border-[color:var(--color-rule)] bg-cream-50"
                      }
                    />
                    <div>
                      <p
                        className={
                          current
                            ? "font-display text-lg text-olive-900 italic font-light"
                            : reached
                              ? "text-olive-800"
                              : "text-olive-500"
                        }
                      >
                        {stage.label}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Submitted details */}
          <section className="card p-7 space-y-6">
            <p className="eyebrow text-clay-500">Submitted details</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-olive-800">
              <Detail label="Customer type" value={titleCase(order.customerType)} />
              <Detail label="Business" value={order.businessName ?? "—"} />
              <Detail label="Contact" value={order.contactName ?? "—"} />
              <Detail label="Email" value={order.contactEmail ?? "—"} />
              <Detail label="Phone" value={order.contactPhone ?? "—"} />
              <Detail label="Fabric" value={titleCase(order.fabric)} />
              <Detail label="Edge style" value={titleCase(order.edgeStyle)} />
              <Detail label="Colour" value={titleCase(order.colour)} />
              <Detail label="Quantity tier" value={titleCase(order.quantityTier)} />
              <Detail label="Quantity" value={order.quantity ? String(order.quantity) : "—"} />
              <Detail
                label="Preferred deadline"
                value={
                  order.preferredDeadline
                    ? formatDate(order.preferredDeadline, "long")
                    : "—"
                }
              />
              <Detail
                label="Payment preference"
                value={titleCase(order.paymentSetting?.replace(/_/g, " ") ?? "")}
              />
            </dl>
            {order.brandNotes && (
              <div className="pt-4 border-t border-[color:var(--border-hairline)]">
                <p className="eyebrow text-olive-500 mb-2">Notes for the studio</p>
                <p className="text-olive-800 leading-relaxed whitespace-pre-line">
                  {order.brandNotes}
                </p>
              </div>
            )}
          </section>

          {/* Brand uploads */}
          {(order.logoUrl || order.inspirationUrls.length > 0) && (
            <section className="card p-7 space-y-6">
              <div className="flex items-baseline justify-between">
                <p className="eyebrow text-clay-500">Your brand files</p>
                <span className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
                  {(order.logoUrl ? 1 : 0) + order.inspirationUrls.length} files
                </span>
              </div>
              {order.logoUrl && (
                <div>
                  <p className="eyebrow text-olive-500 mb-2">Logo</p>
                  <FileTile url={order.logoUrl} />
                </div>
              )}
              {order.inspirationUrls.length > 0 && (
                <div>
                  <p className="eyebrow text-olive-500 mb-2">Inspiration</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {order.inspirationUrls.map((url, i) => (
                      <FileTile key={url + i} url={url} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right — actions sidebar */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-8 self-start">
          <div className="card p-7">
            <p className="eyebrow text-clay-500 mb-4">Studio</p>
            <p className="text-olive-800 leading-relaxed text-[15px]">
              Questions about your fabric, edge, lead time or invoice? Open a
              thread with the studio — we usually reply within a few hours
              during studio days.
            </p>
            <Link
              href="/account/messages"
              className="btn btn-secondary mt-5 w-full"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
              Messages
            </Link>
          </div>

          {canPay && (
            <div className="card p-7">
              <p className="eyebrow text-clay-500 mb-3">Next step</p>
              <p className="font-display text-xl text-olive-900 italic font-light leading-snug">
                {order.status === "quote_sent"
                  ? "Approve the quote to lock production."
                  : "Pay the outstanding balance."}
              </p>
              <Link
                href={`/account/custom-orders/${order.reference}/pay`}
                className="btn mt-5 w-full"
              >
                <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} />
                {order.status === "quote_sent" ? "Pay deposit or in full" : "Pay balance"}
              </Link>
              <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-olive-500 text-center">
                Secured by Stripe
              </p>
            </div>
          )}

          {!canPay && hasQuote && outstanding === 0 && (
            <div className="card p-7 text-center">
              <Sparkles className="h-5 w-5 text-clay-500 mx-auto mb-3" strokeWidth={1.5} aria-hidden />
              <p className="font-display text-xl text-olive-900 italic font-light">
                You're paid in full.
              </p>
              <p className="text-[12px] text-olive-600 mt-2">
                We'll be in touch the week before despatch.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-olive-500 mb-1">{label}</dt>
      <dd className="text-olive-800">{value || "—"}</dd>
    </div>
  );
}

function FileTile({ url }: { url: string }) {
  const isImage = /\.(png|jpe?g|webp|avif|gif)(\?.*)?$/i.test(url);
  const filename = url.split("/").pop()?.split("?")[0] ?? "file";
  if (isImage) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="group relative aspect-square overflow-hidden rounded-md border border-[color:var(--border-base)] bg-[color:var(--color-paper)]"
      >
        <Image
          src={url}
          alt={filename}
          fill
          sizes="220px"
          className="object-cover transition-transform group-hover:scale-105"
          unoptimized
        />
        <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cream-50/95 text-[10px] uppercase tracking-[0.14em] text-olive-700">
          Open
          <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={1.6} />
        </span>
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-md border border-[color:var(--border-base)] bg-[color:var(--color-paper)] px-4 py-3 hover:border-olive-300 transition-colors"
    >
      <FileText className="h-4 w-4 text-olive-600" strokeWidth={1.5} />
      <span className="text-[12px] uppercase tracking-[0.14em] text-olive-700 truncate flex-1">
        {filename}
      </span>
      <ArrowUpRight className="h-3 w-3 text-olive-500 group-hover:text-clay-500 transition-colors" strokeWidth={1.5} />
    </a>
  );
}

function titleCase(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .split(/[\s_-]+/)
    .map((word) => (word ? word[0]?.toUpperCase() + word.slice(1).toLowerCase() : ""))
    .join(" ");
}
