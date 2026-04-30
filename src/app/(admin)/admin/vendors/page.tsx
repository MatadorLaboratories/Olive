import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { VendorRowActions } from "@/components/admin/VendorRowActions";
import { getAdminVendors } from "@/services/admin/people";
import { formatDate, formatMoney } from "@/lib/format";

export default async function AdminVendors() {
  const vendors = await getAdminVendors();
  const pending = vendors.filter((v) => v.status === "applied" || v.status === "in_review").length;

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        eyebrow="Vendors"
        title={<>Trade <span className="italic font-light">accounts.</span></>}
        description={
          pending > 0
            ? `${pending} application${pending === 1 ? "" : "s"} awaiting review · ${vendors.length} total trade accounts.`
            : `${vendors.length} trade accounts. All caught up.`
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm tabular">
          <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Business</th>
              <th className="text-left px-5 py-3 font-medium">Type</th>
              <th className="text-left px-5 py-3 font-medium">Region</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Tier</th>
              <th className="text-right px-5 py-3 font-medium">Bookings</th>
              <th className="text-right px-5 py-3 font-medium">Spend</th>
              <th className="text-left px-5 py-3 font-medium">Applied</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-cream-100/60 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-display text-olive-900">{v.businessName}</p>
                  <p className="text-[12px] text-olive-600">{v.contactName ?? "—"}</p>
                </td>
                <td className="px-5 py-4 text-olive-700 capitalize">{v.vendorType ?? "—"}</td>
                <td className="px-5 py-4 text-olive-700">{v.region ?? "—"}</td>
                <td className="px-5 py-4"><StatusBadge kind="vendor" value={v.status} /></td>
                <td className="px-5 py-4 text-olive-700">
                  {v.discountTier ? (
                    <span>{v.discountTier} <span className="text-clay-500 tabular">−{v.discountPct}%</span></span>
                  ) : "—"}
                </td>
                <td className="px-5 py-4 text-right text-olive-800">{v.bookingCount}</td>
                <td className="px-5 py-4 text-right text-olive-800">{formatMoney(v.spendCents)}</td>
                <td className="px-5 py-4 text-olive-600 text-[12px]">{v.appliedAt ? formatDate(v.appliedAt, "short") : "—"}</td>
                <td className="px-5 py-4 text-right">
                  <VendorRowActions vendorId={v.id} status={v.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
