import Link from "next/link";
import Image from "next/image";
import { Plus, Edit3 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { getProducts } from "@/services/catalogue";
import { formatMoney } from "@/lib/format";

export default async function AdminProducts() {
  const products = await getProducts();

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        eyebrow="Catalogue"
        title={<>The <span className="italic font-light">catalogue.</span></>}
        description={`${products.length} products. Edit hire / retail pricing, fabric, colour, imagery and active state.`}
        actions={
          <Link href="/admin/products/new" className="btn btn-clay !py-3">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            New product
          </Link>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm tabular">
          <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Product</th>
              <th className="text-left px-5 py-3 font-medium">Category</th>
              <th className="text-left px-5 py-3 font-medium">Kind</th>
              <th className="text-right px-5 py-3 font-medium">Hire</th>
              <th className="text-right px-5 py-3 font-medium">Retail</th>
              <th className="text-right px-5 py-3 font-medium">Replacement</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-cream-100/60 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.heroImageUrl && (
                      <span className="frame relative h-10 w-10 shrink-0">
                        <Image src={p.heroImageUrl} alt="" fill sizes="40px" className="object-cover" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-display text-olive-900 truncate">
                        {p.name}{p.colour && <span className="text-olive-600"> — {p.colour}</span>}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-olive-500 truncate">{p.fabric ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-olive-700 capitalize">{p.category ?? "—"}</td>
                <td className="px-5 py-4">
                  <span className="pill border-[color:var(--color-rule)] text-olive-700 capitalize">{p.kind}</span>
                </td>
                <td className="px-5 py-4 text-right text-olive-800">
                  {p.hirePriceCents ? formatMoney(p.hirePriceCents) : "—"}
                </td>
                <td className="px-5 py-4 text-right text-olive-800">
                  {p.retailPriceCents ? formatMoney(p.retailPriceCents) : "—"}
                </td>
                <td className="px-5 py-4 text-right text-olive-700">
                  {p.replacementCostCents ? formatMoney(p.replacementCostCents) : "—"}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/products/${p.slug}`}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500"
                  >
                    <Edit3 className="h-3 w-3" strokeWidth={1.5} />
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
