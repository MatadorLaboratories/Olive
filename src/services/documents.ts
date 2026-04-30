import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "./_supabase-available";

export type AccountDocument = {
  id: string;
  bookingId: string | null;
  bookingReference: string | null;
  eventDate: string | null;
  kind: string;
  name: string;
  sizeBytes: number | null;
  mimeType: string | null;
  createdAt: string;
  downloadUrl: string | null;
};

type DocumentRow = {
  id: string;
  booking_id: string | null;
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
};

function bucketForDocument(doc: Pick<DocumentRow, "kind">) {
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
    .select("id, booking_id, kind, name, storage_path, size_bytes, mime_type, created_at, bookings:booking_id(reference, event_date)")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[documents] read failed", error);
    return [];
  }

  const rows = data as unknown as DocumentRow[];
  const signedUrls = await Promise.all(rows.map((row) => signDocumentUrl(row)));

  return rows.map((row, index) => ({
    id: row.id,
    bookingId: row.booking_id,
    bookingReference: row.bookings?.reference ?? null,
    eventDate: row.bookings?.event_date ?? null,
    kind: row.kind,
    name: row.name,
    sizeBytes: row.size_bytes ?? null,
    mimeType: row.mime_type ?? null,
    createdAt: row.created_at,
    downloadUrl: signedUrls[index] ?? null,
  }));
}
