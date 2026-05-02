import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, FileText, Mail } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CustomOrderQuoteForm } from "@/components/admin/CustomOrderQuoteForm";
import { getCustomOrderByReference } from "@/services/admin/pipeline";
import { formatDate, formatMoney } from "@/lib/format";

type Params = { reference: string };

/**
 * Admin custom-order detail.
 *
 * Three columns of information density:
 *  - Customer-submitted details (read-only).
 *  - Quote editor (set total, status, internal notes — sends email on
 *    transition to `quote_sent`).
 *  - Payment state + brand uploads sidebar.
 */
export default async function AdminCustomOrderDetail({
  params,
}: {
  params: Promise<Params>;
}) {
  const { reference } = await params;
  const order = await getCustomOrderByReference(reference);
  if (!order) notFound();

  const buildLine = [order.fabric, order.edgeStyle, order.colour]
    .filter(Boolean)
    .join(" · ");
  const quote = order.quoteTotalCents ?? 0;
  const totalPaid = order.totalPaidCents ?? 0;
  const outstanding = Math.max(0, quote - totalPaid);

  return (
    <div className="space-y-10 max-w-7xl">
      <Link
        href="/admin/wholesale"
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Pipeline
      </Link>

      <PageHeader
        eyebrow={`Custom order · ${order.reference}`}
        title={
          <>
            {order.businessName ?? order.contactName ?? "Custom order"}
            {buildLine && (
              <span className="block italic font-light text-olive-700/85 text-[0.65em] mt-2 capitalize">
                {buildLine}
              </span>
            )}
          </>
        }
        description={
          <span className="inline-flex items-center gap-3">
            <StatusBadge kind="custom" value={order.status} />
            <span className="text-[12px] uppercase tracking-[0.14em] text-olive-500">
              Submitted {formatDate(order.createdAt, "long")}
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left — submitted details */}
        <div className="lg:col-span-4 space-y-6">
          <section className="card p-7 space-y-5">
            <p className="eyebrow text-clay-500">Customer</p>
            <Detail label="Type" value={titleCase(order.customerType)} />
            <Detail label="Business" value={order.businessName ?? "—"} />
            <Detail label="Contact" value={order.contactName ?? "—"} />
            <Detail
              label="Email"
              value={
                order.contactEmail ? (
                  <a
                    href={`mailto:${order.contactEmail}`}
                    className="lnk inline-flex items-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {order.contactEmail}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Detail label="Phone" value={order.contactPhone ?? "—"} />
          </section>

          <section className="card p-7 space-y-5">
            <p className="eyebrow text-clay-500">Build</p>
            <Detail label="Fabric" value={titleCase(order.fabric)} />
            <Detail label="Edge style" value={titleCase(order.edgeStyle)} />
            <Detail label="Colour" value={titleCase(order.colour)} />
            <Detail label="Quantity tier" value={titleCase(order.quantityTier)} />
            <Detail
              label="Quantity"
              value={order.quantity ? `${order.quantity} pcs` : "—"}
            />
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
          </section>

          {order.brandNotes && (
            <section className="card p-7">
              <p className="eyebrow text-clay-500 mb-3">Notes from customer</p>
              <p className="text-olive-800 leading-relaxed whitespace-pre-line text-[15px]">
                {order.brandNotes}
              </p>
            </section>
          )}
        </div>

        {/* Middle — quote editor */}
        <div className="lg:col-span-5 space-y-6">
          <section className="card p-7">
            <p className="eyebrow text-clay-500 mb-5">Quote & status</p>
            <CustomOrderQuoteForm
              id={order.id}
              reference={order.reference}
              initialQuoteTotalCents={order.quoteTotalCents}
              initialStatus={order.status}
              initialInternalNotes={order.internalNotes}
            />
          </section>
        </div>

        {/* Right — payment + uploads */}
        <aside className="lg:col-span-3 space-y-6">
          <section className="card p-7 space-y-3">
            <p className="eyebrow text-clay-500">Payment</p>
            <Detail label="Quote" value={quote ? formatMoney(quote) : "—"} tabular />
            <Detail label="Deposit paid" value={formatMoney(order.depositPaidCents ?? 0)} tabular />
            <Detail label="Total paid" value={formatMoney(totalPaid)} tabular />
            <Detail
              label="Outstanding"
              value={
                <span className={outstanding > 0 ? "text-clay-600" : "text-olive-700"}>
                  {formatMoney(outstanding)}
                </span>
              }
              tabular
            />
            {order.paidAt && (
              <Detail
                label="Paid in full"
                value={formatDate(order.paidAt, "long")}
              />
            )}
          </section>

          {(order.logoUrl || order.inspirationUrls.length > 0) && (
            <section className="card p-7 space-y-4">
              <div className="flex items-baseline justify-between">
                <p className="eyebrow text-clay-500">Brand files</p>
                <span className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
                  {(order.logoUrl ? 1 : 0) + order.inspirationUrls.length}
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
                  <div className="grid grid-cols-2 gap-2">
                    {order.inspirationUrls.map((url, i) => (
                      <FileTile key={url + i} url={url} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  tabular,
}: {
  label: string;
  value: React.ReactNode;
  tabular?: boolean;
}) {
  return (
    <div>
      <p className="eyebrow text-olive-500 mb-1">{label}</p>
      <p className={tabular ? "text-olive-800 tabular" : "text-olive-800"}>
        {value || "—"}
      </p>
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
          sizes="160px"
          className="object-cover"
          unoptimized
        />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2 rounded-md border border-[color:var(--border-base)] bg-[color:var(--color-paper)] px-3 py-2 hover:border-olive-300 transition-colors"
    >
      <FileText className="h-3.5 w-3.5 text-olive-600" strokeWidth={1.5} />
      <span className="text-[11px] uppercase tracking-[0.14em] text-olive-700 truncate flex-1">
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
