import { NextResponse, type NextRequest } from "next/server";
import { format } from "date-fns";
import { getCurrentProfile } from "@/services/auth";
import { getAllBookings } from "@/services/admin/bookings";
import { supabaseAvailable } from "@/services/_supabase-available";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Xero CSV invoice export.
 *
 * Phase 4a: emits a CSV that maps to Xero's "Sales Invoices" template
 * (https://central.xero.com/s/article/Import-sales-invoices) so the studio
 * can drag-and-drop a month into Xero. Phase 4b will swap to OAuth.
 *
 * Query params:
 *   from = YYYY-MM-DD (default: first of current month)
 *   to   = YYYY-MM-DD (default: today)
 *   status = booking status filter (default: confirmed,final_paid,packed,delivered,returned,completed)
 */
export async function GET(request: NextRequest) {
  // Admin gate (lenient in demo so the file format can be reviewed).
  if (supabaseAvailable()) {
    const profile = await getCurrentProfile();
    const role = (profile as { role?: string } | null)?.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(request.url);
  const today = new Date();
  const from = url.searchParams.get("from") ?? format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd");
  const to = url.searchParams.get("to") ?? format(today, "yyyy-MM-dd");

  const allowed = (url.searchParams.get("status")?.split(",") ?? [
    "confirmed", "final_pending", "final_paid", "packed", "delivered", "returned", "completed",
  ]);

  const bookings = await getAllBookings();
  const inRange = bookings.filter((b) => {
    if (!allowed.includes(b.status)) return false;
    return b.createdAt >= from && b.createdAt <= `${to}T23:59:59Z`;
  });

  // CSV header — matches Xero's import template column names.
  const header = [
    "*ContactName",
    "EmailAddress",
    "*InvoiceNumber",
    "Reference",
    "*InvoiceDate",
    "*DueDate",
    "Description",
    "*Quantity",
    "*UnitAmount",
    "*AccountCode",
    "TaxType",
    "Currency",
  ];

  const rows: string[][] = [header];
  for (const b of inRange) {
    // Single-line summary row per booking — admin can split lines pre-import
    // for itemised invoices if they want.
    rows.push([
      b.clientFullName ?? "Olive Linen Client",
      b.clientEmail ?? "",
      b.reference,
      b.deliveryAddress ?? "",
      format(new Date(b.createdAt), "dd/MM/yyyy"),
      b.finalDueDate ? format(new Date(b.finalDueDate), "dd/MM/yyyy") : format(new Date(b.eventDate), "dd/MM/yyyy"),
      `Linen hire — ${b.deliveryAddress ?? "event"} on ${format(new Date(b.eventDate), "dd MMM yyyy")}`,
      "1",
      ((b.totalCents - b.discountCents) / 100).toFixed(2),
      "200", // sales income — admin can re-map per their chart of accounts
      "Output",
      "NZD",
    ]);
  }

  const csv = rows.map((cols) => cols.map(csvEscape).join(",")).join("\r\n");
  const filename = `olive-linen-xero-${from}_${to}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvEscape(s: string): string {
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
