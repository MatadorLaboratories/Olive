import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  Archive,
  Ban,
  Boxes,
  Plus,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { getInventoryRows } from "@/services/admin/inventory";
import { formatMoney } from "@/lib/format";

export default async function AdminInventory() {
  const rows = await getInventoryRows();

  const totalPieces  = rows.reduce((s, r) => s + r.totalQty, 0);
  const totalDamaged = rows.reduce((s, r) => s + r.damagedQty, 0);
  const totalLost    = rows.reduce((s, r) => s + r.lostQty, 0);
  const totalRetired = rows.reduce((s, r) => s + r.retiredQty, 0);

  const stockValue = rows.reduce(
    (s, r) => s + (r.product.replacementCostCents ?? 0) * r.netUsableQty,
    0,
  );

  const lowStock = rows.filter((r) => r.netUsableQty > 0 && r.netUsableQty <= 12).length;

  return (
    <div className="space-y-10 max-w-7xl">
      <PageHeader
        eyebrow="Inventory"
        title={<>Stock, <span className="italic font-light">at a glance.</span></>}
        description={`${rows.length} SKUs · ${totalPieces.toLocaleString()} pieces total · estimated stock value ${formatMoney(stockValue)}.`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products"
              className="btn btn-secondary !py-3"
            >
              Manage catalogue
            </Link>
            <Link href="/admin/products/new" className="btn !py-3">
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              New product
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total pieces" value={totalPieces.toLocaleString()} icon={Boxes} />
        <StatCard label="Damaged" value={String(totalDamaged)} icon={Wrench} tone={totalDamaged > 0 ? "warning" : "default"} />
        <StatCard label="Lost" value={String(totalLost)} icon={Ban} />
        <StatCard label="Retired" value={String(totalRetired)} icon={Archive} />
      </section>

      {lowStock > 0 && (
        <div className="card border-clay-300/60 bg-clay-50 p-6 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-clay-500 mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <p className="eyebrow text-clay-600 mb-2">{lowStock} SKUs running thin</p>
            <p className="text-sm text-olive-800 leading-relaxed">
              Stock with 12 or fewer usable pieces. Consider re-orders or hiding from the public catalogue until restocked.
            </p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm tabular">
          <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Product</th>
              <th className="text-right px-5 py-3 font-medium">Total</th>
              <th className="text-right px-5 py-3 font-medium">Damaged</th>
              <th className="text-right px-5 py-3 font-medium">Lost</th>
              <th className="text-right px-5 py-3 font-medium">Retired</th>
              <th className="text-right px-5 py-3 font-medium">Net usable</th>
              <th className="text-right px-5 py-3 font-medium">Stock value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
            {rows.map((r) => {
              const valueCents = (r.product.replacementCostCents ?? 0) * r.netUsableQty;
              const low = r.netUsableQty > 0 && r.netUsableQty <= 12;
              return (
                <tr key={r.product.id} className="hover:bg-cream-100/60 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/admin/products/${r.product.slug}`} className="flex items-center gap-3 min-w-0">
                      {r.product.heroImageUrl && (
                        <span className="frame relative h-9 w-9 shrink-0">
                          <Image
                            src={r.product.heroImageUrl}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        </span>
                      )}
                      <span className="min-w-0">
                        <p className="font-display text-olive-900 truncate">
                          {r.product.name}
                          {r.product.colour && <span className="text-olive-600"> — {r.product.colour}</span>}
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-olive-500 truncate">
                          {r.product.fabric}
                        </p>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-right text-olive-800">{r.totalQty}</td>
                  <td className={`px-5 py-4 text-right ${r.damagedQty > 0 ? "text-clay-600" : "text-olive-500"}`}>
                    {r.damagedQty}
                  </td>
                  <td className={`px-5 py-4 text-right ${r.lostQty > 0 ? "text-clay-600" : "text-olive-500"}`}>
                    {r.lostQty}
                  </td>
                  <td className="px-5 py-4 text-right text-olive-500">{r.retiredQty}</td>
                  <td className={`px-5 py-4 text-right font-medium ${low ? "text-clay-600" : "text-olive-900"}`}>
                    {r.netUsableQty}
                  </td>
                  <td className="px-5 py-4 text-right text-olive-700">{formatMoney(valueCents)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
