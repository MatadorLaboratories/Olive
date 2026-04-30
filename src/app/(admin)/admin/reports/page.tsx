import { TrendingUp, Boxes, Wrench, Calendar } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { getAllBookings } from "@/services/admin/bookings";
import { getInventoryRows } from "@/services/admin/inventory";
import { getProducts } from "@/services/catalogue";
import { formatMoney } from "@/lib/format";

export default async function AdminReports() {
  const [bookings, inventory, products] = await Promise.all([
    getAllBookings(),
    getInventoryRows(),
    getProducts(),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Most-booked products
  const productHits = new Map<string, number>();
  for (const b of bookings) {
    if (["cancelled", "archived"].includes(b.status)) continue;
    for (const item of b.items) {
      productHits.set(item.productId, (productHits.get(item.productId) ?? 0) + item.quantity);
    }
  }
  const ranked = [...productHits.entries()]
    .map(([id, qty]) => ({ product: productMap.get(id), qty }))
    .filter((r) => r.product)
    .sort((a, b) => b.qty - a.qty);

  // YTD revenue
  const today = new Date();
  const ytdRevenue = bookings.reduce((s, b) => {
    const created = new Date(b.createdAt);
    if (created.getFullYear() === today.getFullYear()) {
      return s + b.depositPaidCents + b.finalPaidCents;
    }
    return s;
  }, 0);

  // Damage / loss costs
  const damageCost = inventory.reduce(
    (s, r) => s + (r.product.replacementCostCents ?? 0) * (r.damagedQty + r.lostQty),
    0,
  );

  // Forecast pipeline (gross value of confirmed/in-flight bookings)
  const forecastCents = bookings
    .filter((b) => ["confirmed", "final_pending", "deposit_pending", "quoted"].includes(b.status))
    .reduce((s, b) => s + b.totalCents, 0);

  return (
    <div className="space-y-10 max-w-7xl">
      <PageHeader
        eyebrow="Reports"
        title={<>Quiet <span className="italic font-light">numbers.</span></>}
        description="Snapshot of revenue, utilisation, damage/loss and forward bookings."
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Year-to-date revenue" value={formatMoney(ytdRevenue)} icon={TrendingUp} />
        <StatCard label="Forward pipeline" value={formatMoney(forecastCents)} icon={Calendar} />
        <StatCard label="Damage & loss cost" value={formatMoney(damageCost)} icon={Wrench} />
        <StatCard label="Active SKUs" value={String(products.filter((p) => p.status === "active").length)} icon={Boxes} />
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl text-olive-900">Most-booked products</h2>
          <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500">All-time</p>
        </div>
        {ranked.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-display italic text-olive-700 text-2xl">No bookings yet to rank.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm tabular">
              <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Rank</th>
                  <th className="text-left px-5 py-3 font-medium">Product</th>
                  <th className="text-right px-5 py-3 font-medium">Pieces booked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
                {ranked.map((r, i) => (
                  <tr key={r.product!.id} className="hover:bg-cream-100/60 transition-colors">
                    <td className="px-5 py-4 text-olive-500 tabular">{i + 1}</td>
                    <td className="px-5 py-4 font-display text-olive-900">
                      {r.product!.name}
                      {r.product!.colour && <span className="text-olive-600"> — {r.product!.colour}</span>}
                    </td>
                    <td className="px-5 py-4 text-right text-olive-800">{r.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl text-olive-900 mb-4">Damage & loss</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm tabular">
            <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Product</th>
                <th className="text-right px-5 py-3 font-medium">Damaged</th>
                <th className="text-right px-5 py-3 font-medium">Lost</th>
                <th className="text-right px-5 py-3 font-medium">Replacement cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
              {inventory
                .filter((r) => r.damagedQty + r.lostQty > 0)
                .map((r) => {
                  const cost = (r.product.replacementCostCents ?? 0) * (r.damagedQty + r.lostQty);
                  return (
                    <tr key={r.product.id}>
                      <td className="px-5 py-4 font-display text-olive-900">
                        {r.product.name}{r.product.colour && <span className="text-olive-600"> — {r.product.colour}</span>}
                      </td>
                      <td className="px-5 py-4 text-right text-olive-700">{r.damagedQty}</td>
                      <td className="px-5 py-4 text-right text-olive-700">{r.lostQty}</td>
                      <td className="px-5 py-4 text-right text-clay-600">{formatMoney(cost)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
