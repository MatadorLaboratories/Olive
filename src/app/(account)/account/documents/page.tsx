import Link from "next/link";
import { Download, FileText, FolderOpen, Receipt, ScrollText } from "lucide-react";
import { getDocumentsForCurrentUser } from "@/services/documents";
import { formatDate, pluralize } from "@/lib/format";

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function labelForKind(kind: string) {
  switch (kind) {
    case "invoice":
      return "Invoice";
    case "quote":
      return "Quote";
    case "receipt":
      return "Receipt";
    case "contract":
      return "Contract";
    case "timeline":
      return "Timeline";
    default:
      return "Document";
  }
}

function iconForKind(kind: string) {
  switch (kind) {
    case "invoice":
    case "receipt":
      return Receipt;
    case "contract":
      return ScrollText;
    default:
      return FileText;
  }
}

export default async function AccountDocuments() {
  const documents = await getDocumentsForCurrentUser();
  const latestDocument = documents[0] ?? null;

  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <p className="eyebrow mb-3">Documents</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Quotes, invoices, <span className="italic font-light">timelines.</span>
        </h1>
        <p className="mt-4 text-olive-800/80 text-lg leading-relaxed">
          Everything the studio has shared with you in one place. Private file links are refreshed when this page loads.
        </p>
      </header>

      {documents.length === 0 ? (
        <div className="rounded-md border border-dashed border-olive-300 bg-cream-50 p-10 text-center">
          <FolderOpen className="mx-auto h-6 w-6 text-olive-500" strokeWidth={1.5} />
          <p className="mt-5 font-display italic text-olive-700 text-2xl">
            No documents yet.
          </p>
          <p className="mt-3 text-sm text-olive-700 leading-relaxed max-w-lg mx-auto">
            Timelines, invoices and studio paperwork will appear here once they&apos;ve been uploaded against your booking.
          </p>
          <Link href="/account/bookings" className="btn btn-clay mt-6">
            View my bookings
          </Link>
        </div>
      ) : (
        <>
          <div className="card p-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-olive-600 mb-2">Your file cabinet</p>
              <p className="font-display text-2xl text-olive-900">
                {documents.length} {pluralize(documents.length, "document")}
              </p>
            </div>
            <p className="text-sm text-olive-700">
              Most recent upload: {latestDocument ? formatDate(latestDocument.createdAt, "long") : "—"}
            </p>
          </div>

          <ul className="divide-y divide-[color:var(--color-rule-soft)]">
            {documents.map((doc) => {
              const Icon = iconForKind(doc.kind);
              return (
                <li key={doc.id}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-6">
                    <div className="lg:col-span-7 flex items-start gap-4 min-w-0">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-100 text-clay-600">
                        <Icon className="h-4 w-4" strokeWidth={1.5} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-xl text-olive-900 leading-tight break-words">
                          {doc.name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-olive-700">
                          <span className="pill border-clay-300 text-clay-700">
                            {labelForKind(doc.kind)}
                          </span>
                          {doc.bookingReference && (
                            <span className="tabular">Booking {doc.bookingReference}</span>
                          )}
                          {doc.eventDate && (
                            <span>{formatDate(doc.eventDate, "long")}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-3 flex flex-col justify-center gap-1 text-sm text-olive-700">
                      <p>Uploaded {formatDate(doc.createdAt, "long")}</p>
                      <p>
                        {formatFileSize(doc.sizeBytes)}
                        {doc.mimeType ? ` · ${doc.mimeType}` : ""}
                      </p>
                    </div>

                    <div className="lg:col-span-2 flex lg:justify-end items-center">
                      {doc.downloadUrl ? (
                        <a
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary !py-3 w-full lg:w-auto"
                        >
                          Download
                          <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </a>
                      ) : (
                        <span className="text-sm text-clay-600 italic">
                          File unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
