import { Mail, Calendar, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { getEnquiries } from "@/services/admin/pipeline";
import { formatDate } from "@/lib/format";

export default async function AdminEnquiries() {
  const enquiries = await getEnquiries();
  const newCount = enquiries.filter((e) => e.status === "new").length;

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        eyebrow="Enquiries"
        title={<>Inbound <span className="italic font-light">notes.</span></>}
        description={`${newCount} new · ${enquiries.length} total · convert any to a quote or booking with one click.`}
      />

      {enquiries.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="font-display italic text-olive-700 text-2xl">No enquiries — all quiet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {enquiries.map((e) => (
            <li key={e.id} className="card p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`pill capitalize ${e.status === "new" ? "border-clay-300 text-clay-700 bg-clay-50" : "border-[color:var(--color-rule)] text-olive-700"}`}>
                      {e.status.replace("_", " ")}
                    </span>
                    {e.source && (
                      <span className="text-[11px] uppercase tracking-[0.12em] text-olive-500">
                        via {e.source}
                      </span>
                    )}
                    <span className="text-[11px] uppercase tracking-[0.12em] text-olive-500 tabular ml-auto">
                      {formatDate(e.createdAt, "short")}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-olive-900">{e.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-4 text-[13px] text-olive-700">
                    <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1.5 hover:text-clay-500">
                      <Mail className="h-3 w-3" strokeWidth={1.5} />
                      {e.email}
                    </a>
                    {e.phone && <span className="tabular text-olive-600">{e.phone}</span>}
                    {e.eventDate && (
                      <span className="inline-flex items-center gap-1.5 text-olive-600">
                        <Calendar className="h-3 w-3 text-olive-500" strokeWidth={1.5} />
                        Event {formatDate(e.eventDate, "long")}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-olive-800/85 leading-relaxed whitespace-pre-line">
                    {e.message}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button className="btn btn-clay !py-2.5 !text-[12px]">Reply</button>
                  <button className="btn btn-secondary !py-2.5 !text-[12px]">
                    Convert
                    <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
