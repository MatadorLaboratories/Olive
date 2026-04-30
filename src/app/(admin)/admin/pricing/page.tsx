import { PageHeader } from "@/components/admin/PageHeader";
import { formatMoney } from "@/lib/format";

const REGION_FEES = [
  { region: "Queenstown",     cents: 6500,  notes: "Includes Frankton, Kelvin Heights, Lake Hayes." },
  { region: "Arrowtown",      cents: 9500,  notes: "Includes Gibbston Valley." },
  { region: "Wanaka",         cents: 9500,  notes: "Wanaka township + nearby." },
  { region: "Central Otago",  cents: 14500, notes: "Cromwell, Bannockburn, Alexandra." },
  { region: "Elsewhere",      cents: 19500, notes: "Quoted per job — South Island only as a default." },
];

const TIERS = [
  { tier: "Trade-10", pct: 10 },
  { tier: "Trade-15", pct: 15 },
  { tier: "Trade-20", pct: 20 },
];

export default async function AdminPricing() {
  return (
    <div className="space-y-10 max-w-5xl">
      <PageHeader
        eyebrow="Pricing"
        title={<>Hire, retail, <span className="italic font-light">delivery.</span></>}
        description="Per-product hire & retail pricing live on the product editor. Delivery, travel and trade tiers live here."
      />

      <section>
        <h2 className="font-display text-2xl text-olive-900 mb-6">Delivery & travel</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm tabular">
            <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Region</th>
                <th className="text-left px-5 py-3 font-medium">Notes</th>
                <th className="text-right px-5 py-3 font-medium">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
              {REGION_FEES.map((r) => (
                <tr key={r.region}>
                  <td className="px-5 py-4 font-display text-olive-900">{r.region}</td>
                  <td className="px-5 py-4 text-olive-700 text-[13px]">{r.notes}</td>
                  <td className="px-5 py-4 text-right text-olive-800">{formatMoney(r.cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[12px] uppercase tracking-[0.14em] text-olive-500">
          Editor wires to <span className="font-mono normal-case">cms_blocks['pricing.delivery']</span> in Phase 4.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl text-olive-900 mb-6">Trade discount tiers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIERS.map((t) => (
            <div key={t.tier} className="card p-6">
              <p className="eyebrow text-clay-500 mb-2">{t.tier}</p>
              <p className="font-display text-display-sm text-olive-900 tabular">−{t.pct}%</p>
              <p className="mt-2 text-sm text-olive-700">
                Applied to all hire pricing (not delivery, not custom orders) for vendors set to this tier.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-olive-900 mb-6">Custom-order pricing</h2>
        <p className="text-olive-700/85 leading-relaxed max-w-2xl">
          Quantity tiers and per-piece pricing for the napkin builder live in{" "}
          <a href="/admin/cms" className="lnk text-olive-800">CMS · Hospitality · Builder options</a>.
          Edit fabric, edge and colour lists alongside the price-per-unit for each tier.
        </p>
      </section>
    </div>
  );
}
