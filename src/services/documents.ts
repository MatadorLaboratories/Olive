import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "./_supabase-available";

export type AccountDocument = {
  id: string;
  bookingId: string | null;
  customOrderId: string | null;
  /** Reference of whichever order this document is anchored to (booking or custom). */
  orderReference: string | null;
  /** "booking" / "custom_order" / null when neither anchor is set. */
  orderKind: "booking" | "custom_order" | null;
  eventDate: string | null;
  kind: string;
  name: string;
  sizeBytes: number | null;
  mimeType: string | null;
  createdAt: string;
  downloadUrl: string | null;
  /**
   * Receipt-only enrichment — when this row is `kind = "receipt"` and the
   * webhook linked it back to a payment via `payments.receipt_document_id`,
   * we surface the captured amount + payment kind so the documents UI can
   * show "Deposit · NZ$2,375.00" inline without a second round-trip.
   */
  paymentAmountCents: number | null;
  paymentKind: string | null;
  paymentPaidAt: string | null;
};

type DocumentRow = {
  id: string;
  booking_id: string | null;
  custom_order_id: string | null;
  kind: string;
  name: string;
  storage_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
  bookings?: {
    reference?: string | null;
    event_date?: string | null;
  } | null;
  custom_orders?: {
    reference?: string | null;
  } | null;
};

type PaymentEnrichment = {
  document_id: string;
  amount_cents: number;
  kind: string;
  paid_at: string | null;
};

function bucketForDocument(doc: Pick<DocumentRow, "kind">) {
  // Customer-uploaded timelines live in the upload bucket; everything else
  // (studio paperwork + auto-generated receipts) lives in the private
  // documents bucket.
  return doc.kind === "timeline" ? "client-uploads" : "documents";
}

async function signDocumentUrl(doc: DocumentRow) {
  const admin = createSupabaseAdminClient();
  const bucket = bucketForDocument(doc);
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(doc.storage_path, 60 * 60);

  if (error) {
    console.error("[documents] signed URL failed", {
      documentId: doc.id,
      bucket,
      path: doc.storage_path,
      message: error.message,
    });
    return null;
  }

  return data.signedUrl;
}

export async function getDocumentsForCurrentUser(): Promise<AccountDocument[]> {
  if (!supabaseAvailable()) return [];

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, booking_id, custom_order_id, kind, name, storage_path, size_bytes, mime_type, created_at, bookings:booking_id(reference, event_date), custom_orders:custom_order_id(reference)",
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[documents] read failed", error);
    return [];
  }

  const rows = data as unknown as DocumentRow[];

  // Enrich any receipt rows with their payment context. We use the
  // user-scoped supabase client — RLS lets the customer SELECT payments
  // they own, so this returns only their own enrichment data.
  const receiptIds = rows.filter((r) => r.kind === "receipt").map((r) => r.id);
  let paymentByDocId = new Map<string, PaymentEnrichment>();
  if (receiptIds.length > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("receipt_document_id, amount_cents, kind, paid_at")
      .in("receipt_document_id", receiptIds);
    if (payments) {
      paymentByDocId = new Map(
        (payments as Array<Record<string, unknown>>)
          .filter((p) => typeof p.receipt_document_id === "string")
          .map((p) => [
            p.receipt_document_id as string,
            {
              document_id: p.receipt_document_id as string,
              amount_cents: Number(p.amount_cents ?? 0),
              kind: String(p.kind ?? ""),
              paid_at: (p.paid_at as string | null) ?? null,
            },
          ]),
      );
    }
  }

  const signedUrls = await Promise.all(rows.map((row) => signDocumentUrl(row)));

  return rows.map((row, index) => {
    const orderKind: AccountDocument["orderKind"] = row.booking_id
      ? "booking"
      : row.custom_order_id
        ? "custom_order"
        : null;
    const orderReference =
      row.bookings?.reference ?? row.custom_orders?.reference ?? null;
    const enrichment = paymentByDocId.get(row.id) ?? null;
    return {
      id: row.id,
      bookingId: row.booking_id,
      customOrderId: row.custom_order_id,
      orderReference,
      orderKind,
      eventDate: row.bookings?.event_date ?? null,
      kind: row.kind,
      name: row.name,
      sizeBytes: row.size_bytes ?? null,
      mimeType: row.mime_type ?? null,
      createdAt: row.created_at,
      downloadUrl: signedUrls[index] ?? null,
      paymentAmountCents: enrichment?.amount_cents ?? null,
      paymentKind: enrichment?.kind ?? null,
      paymentPaidAt: enrichment?.paid_at ?? null,
    };
  });
}
