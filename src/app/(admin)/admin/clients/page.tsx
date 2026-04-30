import { Mail, Phone, Calendar } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { getAdminClients } from "@/services/admin/people";
import { formatDate, formatMoney } from "@/lib/format";

export default async function AdminClients() {
  const clients = await getAdminClients();

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        eyebrow="Clients"
        title={<>The <span className="italic font-light">people</span> we dress.</>}
        description={`${clients.length} clients · ${formatMoney(clients.reduce((s, c) => s + c.lifetimeSpendCents, 0))} lifetime revenue.`}
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm tabular">
          <thead className="bg-cream-100 text-[11px] uppercase tracking-[0.14em] text-olive-600">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Name</th>
              <th className="text-left px-5 py-3 font-medium">Contact</th>
              <th className="text-right px-5 py-3 font-medium">Bookings</th>
              <th className="text-left px-5 py-3 font-medium">Last event</th>
              <th className="text-right px-5 py-3 font-medium">Lifetime spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-rule-soft)]">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-cream-100/60 transition-colors">
                <td className="px-5 py-4 font-display text-olive-900">{c.fullName}</td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="text-olive-700 hover:text-clay-500 inline-flex items-center gap-2 text-[13px]"
                      >
                        <Mail className="h-3 w-3" strokeWidth={1.5} />
                        {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <p className="text-olive-600 inline-flex items-center gap-2 text-[12px] tabular">
                        <Phone className="h-3 w-3" strokeWidth={1.5} />
                        {c.phone}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-right text-olive-800">{c.bookingCount}</td>
                <td className="px-5 py-4 text-olive-700 inline-flex items-center gap-2">
                  {c.lastEventDate ? (
                    <>
                      <Calendar className="h-3 w-3 text-olive-500" strokeWidth={1.5} />
                      {formatDate(c.lastEventDate, "short")}
                    </>
                  ) : "—"}
                </td>
                <td className="px-5 py-4 text-right text-olive-800">{formatMoney(c.lifetimeSpendCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
