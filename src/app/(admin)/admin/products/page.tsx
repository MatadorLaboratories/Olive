import Link from "next/link";
import Image from "next/image";
import { Edit3, PackagePlus, Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { getAdminProducts } from "@/services/admin/products-read";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ProductStatus } from "@/types/domain";

export default async function AdminProducts() {
  // Admin-scope read — every product, all statuses, drafts included.
  // Customer-facing reads filter by `status='active'` elsewhere.
  const products = await getAdminProducts();
  const draftCount = products.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        eyebrow="Catalogue"
        title={<>The <span className="italic font-light">catalogue.</span></>}
        description={
          products.length > 0
            ? `${products.length} ${products.length === 1 ? "product" : "products"}${
                draftCount > 0 ? ` · ${draftCount} draft${draftCount === 1 ? "" : "s"}` : ""
              }. Edit hire / retail pricing, fabric, colour, imagery and active state.`
            : "Add the first product to populate the shop and the booking flow."
        }
        actions={
          <Link href="/admin/products/new" className="btn !py-3">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            New product
          </Link>
        }
      />

      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <PackagePlus
            className="h-6 w-6 text-clay-500 mx-auto mb-4"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="font-display text-2xl text-olive-900 italic font-light leading-snug">
            Nothing in the catalogue yet.
          </p>
          <p className="mt-3 text-sm text-olive-700/85 max-w-md mx-auto">
            Start with one product — name, slug, kind, pricing — and the hero
            image and gallery uploaders unlock once it's saved.
          </p>
          <Link href="/admin/products/new" className="btn mt-6">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Add the first product
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm tabular">
            <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Product</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
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
                      {p.heroImageUrl ? (
                        <span className="frame relative h-10 w-10 shrink-0">
                          <Image src={p.heroImageUrl} alt="" fill sizes="40px" className="object-cover" />
                        </span>
                      ) : (
                        <span
                          aria-hidden
                          className="frame h-10 w-10 shrink-0 grid place-items-center text-[10px] uppercase tracking-[0.14em] text-olive-500"
                        >
                          —
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-display text-olive-900 truncate">
                          {p.name}
                          {p.colour && <span className="text-olive-600"> — {p.colour}</span>}
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-olive-500 truncate">
                          {p.fabric ?? "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <ProductStatusPill status={p.status} />
                  </td>
                  <td className="px-5 py-4 text-olive-700 capitalize">{p.category ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className="pill border-[color:var(--color-rule)] text-olive-700 capitalize">
                      {p.kind}
                    </span>
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
      )}
    </div>
  );
}

/**
 * Editorial status pill. Draft = quiet outline, Active = olive, Archived =
 * muted clay. Differentiated visually so admins can scan a busy index and
 * tell at a glance which rows are live to customers.
 */
function ProductStatusPill({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, string> = {
    draft:
      "border-[color:var(--color-rule)] text-olive-600 bg-cream-50",
    active: "border-olive-300 text-olive-800 bg-olive-50",
    archived: "border-clay-300/60 text-clay-700 bg-clay-50",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium uppercase tracking-[0.12em] capitalize",
        map[status],
      )}
    >
      {status}
    </span>
  );
}
