import Link from "next/link";
import {
  ArrowUpRight,
  CreditCard,
  Download,
  FileText,
  FolderOpen,
  Receipt,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { getDocumentsForCurrentUser, type AccountDocument } from "@/services/documents";
import { getCustomOrdersForCurrentUser } from "@/services/custom-orders-read";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatMoney, pluralize } from "@/lib/format";
import type { CustomOrder } from "@/types/domain";

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function labelForKind(kind: string) {
  switch (kind) {
    case "invoice":
      return "Invoice";
    case "quote":
      return "Quote";
    case "receipt":
      return "Receipt";
    case "contract":
      return "Contract";
    case "timeline":
      return "Timeline";
    default:
      return "Document";
  }
}

function iconForKind(kind: string) {
  switch (kind) {
    case "invoice":
    case "receipt":
      return Receipt;
    case "contract":
      return ScrollText;
    default:
      return FileText;
  }
}

/**
 * Documents area.
 *
 * Two surfaces:
 *
 * 1. **Active quotes** — `custom_orders` rows with a quote on file and an
 *    outstanding balance (status ∈ {quote_sent, deposit_paid}). Each row
 *    deep-links into the order detail where the customer can pay deposit
 *    or pay in full. This is where unpaid / partially paid hospitality
 *    quotes live; the source of truth is the custom-orders table, not the
 *    documents table, so payment state stays consistent.
 *
 * 2. **Files** — the existing studio-shared file list (timelines,
 *    invoices, contracts, etc.) backed by Supabase Storage.
 */
export default async function AccountDocuments() {
  const [documents, customOrders] = await Promise.all([
    getDocumentsForCurrentUser(),
    getCustomOrdersForCurrentUser(),
  ]);

  // Active quotes: a quote exists, isn't fully paid, and the order isn't
  // closed out. We treat "quote_sent" + "deposit_paid" as the payable
  // window; further-along statuses are managed by the studio directly.
  const activeQuotes = customOrders.filter((o) => {
    if (!["quote_sent", "deposit_paid", "in_production", "ready"].includes(o.status))
      return false;
    const quote = o.quoteTotalCents ?? 0;
    if (quote <= 0) return false;
    const outstanding = quote - (o.totalPaidCents ?? 0);
    return outstanding > 0;
  });

  const latestDocument = documents[0] ?? null;
  const totalSurface = activeQuotes.length + documents.length;

  return (
    <div className="space-y-12">
      <header className="max-w-2xl">
        <p className="eyebrow mb-3">Documents</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Quotes, invoices, <span className="italic font-light">timelines.</span>
        </h1>
        <p className="mt-4 text-olive-800/80 text-lg leading-relaxed">
          Active custom-order quotes sit at the top so you can pay deposit or pay in
          full whenever you're ready. Below, every file the studio has shared with
          you. Private file links are refreshed when this page loads.
        </p>
      </header>

      {/* Active quotes */}
      {activeQuotes.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <p className="eyebrow text-clay-500 mb-1">Active quotes</p>
              <h2 className="font-display text-2xl text-olive-900 leading-tight">
                Ready to <span className="italic font-light">pay or approve.</span>
              </h2>
            </div>
            <span className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
              {activeQuotes.length} {pluralize(activeQuotes.length, "quote")}
            </span>
          </div>

          <ul className="space-y-3">
            {activeQuotes.map((q) => (
              <ActiveQuoteRow key={q.id} order={q} />
            ))}
          </ul>
        </section>
      )}

      {/* Files */}
      {documents.length === 0 && activeQuotes.length === 0 ? (
        <div className="rounded-md border border-dashed border-olive-300 bg-cream-50 p-10 text-center">
          <FolderOpen className="mx-auto h-6 w-6 text-olive-500" strokeWidth={1.5} />
          <p className="mt-5 font-display italic text-olive-700 text-2xl">
            No documents yet.
          </p>
          <p className="mt-3 text-sm text-olive-700 leading-relaxed max-w-lg mx-auto">
            Custom-order quotes, timelines, invoices and studio paperwork will appear
            here once they're ready for you.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/account/bookings" className="btn btn-secondary">
              View my bookings
            </Link>
            <Link href="/hospitality/builder" className="btn">
              Start a custom order
            </Link>
          </div>
        </div>
      ) : (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <p className="eyebrow text-clay-500 mb-1">Files</p>
              <h2 className="font-display text-2xl text-olive-900 leading-tight">
                Studio <span className="italic font-light">paperwork.</span>
              </h2>
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
              {documents.length} {pluralize(documents.length, "file")}
              {latestDocument
                ? ` · last ${formatDate(latestDocument.createdAt, "short")}`
                : ""}
            </p>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-md border border-dashed border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-8 text-center">
              <p className="font-display italic text-olive-700 text-lg">
                No files from the studio yet.
              </p>
              <p className="mt-2 text-sm text-olive-600 max-w-md mx-auto">
                Receipts land here automatically when payments clear. Timelines,
                invoices and signed paperwork follow as the studio shares them.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--color-rule-soft)] border-y border-[color:var(--color-rule-soft)]">
              {documents.map((doc) => (
                <DocumentRowCard key={doc.id} doc={doc} />
              ))}
            </ul>
          )}
        </section>
      )}

      {totalSurface > 0 && (
        <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500 text-center">
          Need a fresh quote? Start one anytime —{" "}
          <Link href="/hospitality/builder" className="lnk">
            custom builder
          </Link>
          .
        </p>
      )}
    </div>
  );
}

/**
 * One row in the studio-paperwork file list. Renders the kind-specific
 * icon, name, anchor reference, and download CTA. Receipts get an extra
 * inline payment-amount + payment-kind summary on the right so the row
 * reads as a real receipt, not a generic file link.
 */
function DocumentRowCard({ doc }: { doc: AccountDocument }) {
  const Icon = iconForKind(doc.kind);
  const isReceipt = doc.kind === "receipt";
  const paymentLabel = paymentKindLabel(doc.paymentKind);

  return (
    <li>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-6">
        <div className="lg:col-span-6 flex items-start gap-4 min-w-0">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-100 text-clay-600">
            <Icon className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl text-olive-900 leading-tight break-words">
              {doc.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-olive-700">
              <span className="pill border-clay-300 text-clay-700">
                {labelForKind(doc.kind)}
              </span>
              {doc.orderReference && (
                <span className="tabular">
                  {doc.orderKind === "custom_order" ? "Custom" : "Booking"}{" "}
                  {doc.orderReference}
                </span>
              )}
              {doc.eventDate && <span>{formatDate(doc.eventDate, "long")}</span>}
            </div>
          </div>
        </div>

        {/* Receipt-specific column: amount + payment kind. For non-receipt
            rows we keep the original meta block (uploaded date + size). */}
        <div className="lg:col-span-3 flex flex-col justify-center gap-1 text-sm text-olive-700">
          {isReceipt && doc.paymentAmountCents != null ? (
            <>
              <p className="font-display text-2xl text-olive-900 tabular leading-none">
                {formatMoney(doc.paymentAmountCents)}
              </p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
                {paymentLabel}
                {doc.paymentPaidAt
                  ? ` · ${formatDate(doc.paymentPaidAt, "short")}`
                  : ""}
              </p>
            </>
          ) : (
            <>
              <p>Uploaded {formatDate(doc.createdAt, "long")}</p>
              <p>
                {formatFileSize(doc.sizeBytes)}
                {doc.mimeType ? ` · ${doc.mimeType}` : ""}
              </p>
            </>
          )}
        </div>

        <div className="lg:col-span-3 flex lg:justify-end items-center">
          {doc.downloadUrl ? (
            <a
              href={doc.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary !py-3 w-full lg:w-auto"
            >
              Download
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            </a>
          ) : (
            <span className="text-sm text-clay-600 italic">
              File unavailable
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function paymentKindLabel(kind: string | null): string {
  switch (kind) {
    case "deposit":
      return "Deposit payment";
    case "final":
      return "Final balance";
    case "adjustment":
      return "Adjustment";
    case "refund":
      return "Refund";
    default:
      return "Payment";
  }
}

/**
 * One row of the active-quotes list. Renders the order's headline numbers
 * and inline pay buttons. The buttons deep-link into the existing pay page
 * with a `?mode=` so the picker pre-selects.
 */
function ActiveQuoteRow({ order }: { order: CustomOrder }) {
  const quote = order.quoteTotalCents ?? 0;
  const totalPaid = order.totalPaidCents ?? 0;
  const outstanding = Math.max(0, quote - totalPaid);
  const depositTarget = Math.round(quote * 0.5);
  const depositRemaining = Math.max(0, depositTarget - (order.depositPaidCents ?? 0));
  const depositAvailable = depositRemaining > 0 && depositRemaining < outstanding;

  const buildLine = [order.fabric, order.edgeStyle, order.colour]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="card p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Title + status */}
        <div className="lg:col-span-5 flex items-start gap-4 min-w-0">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-100 text-clay-600">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl text-olive-900 leading-tight">
              {order.businessName ?? `Custom napkin order`}
            </p>
            <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-olive-500 capitalize">
              {buildLine || "Custom build"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge kind="custom" value={order.status} />
              <span className="text-[11px] uppercase tracking-[0.14em] text-olive-500 tabular">
                {order.reference}
              </span>
            </div>
          </div>
        </div>

        {/* Numbers */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="eyebrow text-olive-500 mb-1">Quote</p>
            <p className="font-display text-lg text-olive-900 tabular">
              {formatMoney(quote)}
            </p>
          </div>
          <div>
            <p className="eyebrow text-olive-500 mb-1">Outstanding</p>
            <p className="font-display text-lg text-clay-600 tabular">
              {formatMoney(outstanding)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="lg:col-span-4 flex flex-col gap-2 lg:items-end">
          <div className="flex flex-wrap gap-2 lg:justify-end w-full">
            {depositAvailable && (
              <Link
                href={`/account/custom-orders/${order.reference}/pay?mode=deposit`}
                className="btn !py-3 !text-[12px] flex-1 lg:flex-initial"
              >
                <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} />
                Pay deposit · {formatMoney(depositRemaining)}
              </Link>
            )}
            <Link
              href={`/account/custom-orders/${order.reference}/pay?mode=full`}
              className="btn btn-secondary !py-3 !text-[12px] flex-1 lg:flex-initial"
            >
              Pay in full
            </Link>
          </div>
          <Link
            href={`/account/custom-orders/${order.reference}`}
            className="text-[11px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors inline-flex items-center gap-1"
          >
            View quote
            <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </li>
  );
}
