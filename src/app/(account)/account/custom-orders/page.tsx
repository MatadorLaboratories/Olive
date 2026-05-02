import Link from "next/link";
import { ArrowUpRight, PencilLine, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getCustomOrdersForCurrentUser } from "@/services/custom-orders-read";
import { formatDate, formatMoney } from "@/lib/format";

/**
 * Custom-orders index for the client portal.
 *
 * Posture: editorial list, not a SaaS table — each order reads like an
 * index card with reference, build (fabric · edge · colour), quote, and
 * status. The clay action sits on each row's "Open" arrow rather than as
 * a dense button column.
 */
export default async function CustomOrdersIndex() {
  const orders = await getCustomOrdersForCurrentUser();

  return (
    <div className="space-y-12 max-w-5xl">
      <header>
        <p className="eyebrow mb-3">Custom orders</p>
        <h1 className="font-display text-display-lg text-olive-900 leading-[1]">
          Your <span className="italic font-light">custom orders.</span>
        </h1>
        <p className="mt-4 text-olive-800/80 text-lg max-w-xl">
          Custom napkin runs you've started with the studio — quote, deposit,
          production and despatch all live here.
        </p>
      </header>

      {orders.length === 0 ? (
        <section className="card p-10 text-center">
          <Sparkles
            className="h-5 w-5 text-clay-500 mx-auto mb-4"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="font-display text-2xl text-olive-900 italic font-light leading-snug max-w-md mx-auto">
            Nothing custom yet — that's a clean canvas.
          </p>
          <p className="mt-3 text-olive-800/80 max-w-md mx-auto">
            Tell us a bit about your fabric, edge and quantity and we'll come
            back with a written quote inside three business days.
          </p>
          <Link href="/hospitality/builder" className="btn mt-7">
            <PencilLine className="h-3.5 w-3.5" strokeWidth={1.5} />
            Start a custom order
          </Link>
        </section>
      ) : (
        <ul className="divide-y divide-[color:var(--border-hairline)] border-y border-[color:var(--border-hairline)]">
          {orders.map((o) => {
            const buildLine = [o.fabric, o.edgeStyle, o.colour]
              .filter(Boolean)
              .join(" · ");
            const outstanding =
              (o.quoteTotalCents ?? 0) - (o.totalPaidCents ?? 0);
            return (
              <li key={o.id}>
                <Link
                  href={`/account/custom-orders/${o.reference}`}
                  className="group grid grid-cols-12 gap-4 py-6 items-baseline transition-colors hover:bg-cream-50/40"
                >
                  <div className="col-span-12 md:col-span-3">
                    <p className="eyebrow text-olive-500 mb-1">Reference</p>
                    <p className="font-display text-xl text-olive-900 tabular">
                      {o.reference}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-olive-500">
                      Started {formatDate(o.createdAt, "short")}
                    </p>
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <p className="eyebrow text-olive-500 mb-1">Build</p>
                    <p className="text-olive-800 capitalize">
                      {buildLine || "—"}
                    </p>
                    {o.quantity ? (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-olive-500">
                        {o.quantity} pcs
                      </p>
                    ) : null}
                  </div>

                  <div className="col-span-6 md:col-span-3">
                    <p className="eyebrow text-olive-500 mb-1">Quote</p>
                    {o.quoteTotalCents ? (
                      <>
                        <p className="font-display text-xl text-olive-900 tabular">
                          {formatMoney(o.quoteTotalCents)}
                        </p>
                        {outstanding > 0 ? (
                          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-clay-600">
                            {formatMoney(outstanding)} outstanding
                          </p>
                        ) : (
                          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-olive-600">
                            Paid in full
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-olive-700 italic font-light text-sm">
                        Awaiting quote
                      </p>
                    )}
                  </div>

                  <div className="col-span-6 md:col-span-2 flex md:flex-col md:items-end gap-2 md:gap-3 items-baseline justify-between">
                    <StatusBadge kind="custom" value={o.status} />
                    <span className="text-[11px] uppercase tracking-[0.16em] text-olive-700 inline-flex items-center gap-1 group-hover:text-clay-600 transition-colors">
                      Open
                      <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="text-center pt-4">
        <Link
          href="/hospitality/builder"
          className="text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors inline-flex items-center gap-2"
        >
          <PencilLine className="h-3.5 w-3.5" strokeWidth={1.5} />
          Start another custom order
        </Link>
      </div>
    </div>
  );
}
