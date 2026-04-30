import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getCustomOrders } from "@/services/admin/pipeline";
import { formatDate, formatMoney } from "@/lib/format";
import type { CustomOrderStatus } from "@/types/domain";

const STAGES: Array<{ id: CustomOrderStatus; label: string }> = [
  { id: "new_request",    label: "New request" },
  { id: "awaiting_quote", label: "Awaiting quote" },
  { id: "quote_sent",     label: "Quote sent" },
  { id: "deposit_paid",   label: "Deposit paid" },
  { id: "in_production",  label: "In production" },
  { id: "ready",          label: "Ready" },
  { id: "completed",      label: "Completed" },
  { id: "cancelled",      label: "Cancelled" },
];

export default async function AdminWholesale() {
  const orders = await getCustomOrders();
  const byStage = new Map<CustomOrderStatus, typeof orders>();
  for (const stage of STAGES) byStage.set(stage.id, []);
  for (const o of orders) byStage.get(o.status)?.push(o);

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        eyebrow="Wholesale & custom"
        title={<>Custom <span className="italic font-light">orders.</span></>}
        description={`${orders.length} live custom orders moving through the pipeline.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const items = byStage.get(stage.id) ?? [];
          return (
            <section key={stage.id} className="card p-4 min-h-[12rem]">
              <header className="flex items-baseline justify-between mb-3">
                <p className="eyebrow text-olive-700">{stage.label}</p>
                <span className="text-[11px] tabular text-olive-500">{items.length}</span>
              </header>
              {items.length === 0 ? (
                <p className="text-[12px] italic text-olive-500 font-display">—</p>
              ) : (
                <ul className="space-y-3">
                  {items.map((o) => (
                    <li key={o.id} className="rounded-md border border-[color:var(--color-rule-soft)] bg-cream-50 p-3 hover:border-olive-300 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-display text-olive-900 truncate text-sm">
                          {o.businessName ?? o.contactName ?? o.reference}
                        </p>
                        <StatusBadge kind="custom" value={o.status} />
                      </div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-olive-500 truncate">
                        {o.fabric} · {o.edgeStyle} · {o.colour}
                      </p>
                      <p className="text-[11px] text-olive-600 mt-2 tabular">
                        {o.quantity ? `${o.quantity} pcs` : o.quantityTier}
                        {o.quoteTotalCents && <span className="text-clay-600"> · {formatMoney(o.quoteTotalCents)}</span>}
                      </p>
                      {o.preferredDeadline && (
                        <p className="text-[11px] text-olive-500 mt-1">
                          Deadline {formatDate(o.preferredDeadline, "short")}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.12em] text-olive-500 tabular">
                          {o.reference}
                        </span>
                        <button className="text-[11px] uppercase tracking-[0.12em] text-olive-700 hover:text-clay-500 inline-flex items-center gap-1">
                          Open
                          <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
