import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "../_supabase-available";
import { seedBookings } from "@/data/seed/bookings";
import type { BookingWithItems } from "../bookings-read";

export type AdminBookingsFilter = {
  status?: string;
  search?: string;
  sort?: "soonest" | "newest" | "value";
};

/**
 * Admin bookings — full table read with optional filters.
 * Demo mode synthesises a small, realistic set so the UI populates well.
 */
export async function getAllBookings(filter: AdminBookingsFilter = {}): Promise<BookingWithItems[]> {
  if (!supabaseAvailable()) return applyFilter(seedAllBookings, filter);

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("bookings")
    .select("*, booking_items(*)")
    .order("event_date", { ascending: filter.sort !== "newest" });

  if (filter.status && filter.status !== "all") {
    query = query.eq("status", filter.status);
  }
  if (filter.search) {
    // Server-side filter: ref or address ilike.
    query = query.or(`reference.ilike.%${filter.search}%,delivery_address.ilike.%${filter.search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.warn("[admin.bookings] read failed; using seed", error?.message);
    return applyFilter(seedAllBookings, filter);
  }
  return (data as Array<Record<string, unknown>>).map(rowToBooking);
}

export async function getBookingById(id: string): Promise<BookingWithItems | null> {
  if (!supabaseAvailable()) {
    return seedAllBookings.find((b) => b.id === id) ?? null;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, booking_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToBooking(data as Record<string, unknown>);
}

// ---------- KPI snapshot ----------
export type AdminDashboardSnapshot = {
  upcoming30: number;
  monthRevenueCents: number;
  outstandingCents: number;
  lowStockCount: number;
};

export async function getDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const all = await getAllBookings();
  const now = new Date();
  const thirtyOut = new Date();
  thirtyOut.setDate(now.getDate() + 30);

  const upcoming30 = all.filter((b) => {
    const event = new Date(b.eventDate);
    return event >= now && event <= thirtyOut && !["cancelled", "archived"].includes(b.status);
  }).length;

  const month = now.getMonth();
  const year = now.getFullYear();
  const monthRevenueCents = all.reduce((sum, b) => {
    const created = new Date(b.createdAt);
    if (created.getMonth() === month && created.getFullYear() === year) {
      return sum + b.depositPaidCents + b.finalPaidCents;
    }
    return sum;
  }, 0);

  const outstandingCents = all.reduce((sum, b) => {
    if (["cancelled", "archived"].includes(b.status)) return sum;
    return sum + Math.max(0, b.totalCents - b.depositPaidCents - b.finalPaidCents);
  }, 0);

  return {
    upcoming30,
    monthRevenueCents,
    outstandingCents,
    lowStockCount: 3, // wired to inventory in admin/inventory page; placeholder here
  };
}

// ---------- mappers (kept here so admin doesn't import from client read service) ----------
function rowToBooking(row: Record<string, unknown>): BookingWithItems {
  const items = (row.booking_items as Array<Record<string, unknown>> | undefined)?.map((i) => ({
    id: String(i.id),
    bookingId: String(i.booking_id),
    productId: String(i.product_id),
    quantity: Number(i.quantity),
    unitPriceCents: Number(i.unit_price_cents),
    lineTotalCents: Number(i.line_total_cents),
    notes: (i.notes as string | null) ?? null,
  })) ?? [];
  return {
    id: String(row.id),
    reference: String(row.reference),
    status: row.status as BookingWithItems["status"],
    clientId: (row.client_id as string | null) ?? null,
    vendorId: (row.vendor_id as string | null) ?? null,
    clientFullName: (row.client_full_name as string | null) ?? null,
    clientEmail: (row.client_email as string | null) ?? null,
    clientPhone: (row.client_phone as string | null) ?? null,
    eventDate: String(row.event_date),
    deliveryDate: String(row.delivery_date),
    returnDate: String(row.return_date),
    deliveryAddress: (row.delivery_address as string | null) ?? null,
    deliveryCity: (row.delivery_city as string | null) ?? null,
    deliveryRegion: (row.delivery_region as string | null) ?? null,
    deliveryWindow: (row.delivery_window as string | null) ?? null,
    collectionWindow: (row.collection_window as string | null) ?? null,
    onSiteContact: (row.on_site_contact as string | null) ?? null,
    subtotalCents: Number(row.subtotal_cents ?? 0),
    discountCents: Number(row.discount_cents ?? 0),
    deliveryFeeCents: Number(row.delivery_fee_cents ?? 0),
    totalCents: Number(row.total_cents ?? 0),
    depositDueCents: Number(row.deposit_due_cents ?? 0),
    depositPaidCents: Number(row.deposit_paid_cents ?? 0),
    finalDueCents: Number(row.final_due_cents ?? 0),
    finalPaidCents: Number(row.final_paid_cents ?? 0),
    finalDueDate: (row.final_due_date as string | null) ?? null,
    cutoffLocked: Boolean(row.cutoff_locked),
    adminOverride: Boolean(row.admin_override),
    notesInternal: (row.notes_internal as string | null) ?? null,
    notesClient: (row.notes_client as string | null) ?? null,
    timelineUrl: (row.timeline_url as string | null) ?? null,
    source: (row.source as string | null) ?? null,
    createdAt: String(row.created_at ?? ""),
    confirmedAt: (row.confirmed_at as string | null) ?? null,
    cancelledAt: (row.cancelled_at as string | null) ?? null,
    items,
  };
}

function applyFilter(rows: BookingWithItems[], filter: AdminBookingsFilter): BookingWithItems[] {
  let out = [...rows];
  if (filter.status && filter.status !== "all") {
    out = out.filter((b) => b.status === filter.status);
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    out = out.filter(
      (b) =>
        b.reference.toLowerCase().includes(q) ||
        (b.deliveryAddress ?? "").toLowerCase().includes(q) ||
        (b.clientFullName ?? "").toLowerCase().includes(q),
    );
  }
  if (filter.sort === "newest") {
    out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (filter.sort === "value") {
    out.sort((a, b) => b.totalCents - a.totalCents);
  } else {
    out.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  }
  return out;
}

// ---------- Demo seed (richer than the client portal seed) ----------
const seedAllBookings: BookingWithItems[] = [
  ...seedBookings,
  {
    id: "b_1043",
    reference: "OLV-1043",
    status: "quoted",
    clientId: null,
    vendorId: null,
    clientFullName: "Margot Group",
    clientEmail: "ops@margot.co.nz",
    clientPhone: "+64 3 555 0102",
    eventDate: "2026-06-19",
    deliveryDate: "2026-06-19",
    returnDate: "2026-06-20",
    deliveryAddress: "Margot Queenstown",
    deliveryCity: "Queenstown",
    deliveryRegion: "queenstown",
    deliveryWindow: "2 – 4pm",
    collectionWindow: "11pm – 1am",
    onSiteContact: "Reuben Sharp — 027 000 0001",
    subtotalCents: 25600,
    discountCents: 0,
    deliveryFeeCents: 6500,
    totalCents: 32100,
    depositDueCents: 16050,
    depositPaidCents: 0,
    finalDueCents: 32100,
    finalPaidCents: 0,
    finalDueDate: "2026-05-20",
    cutoffLocked: false,
    adminOverride: false,
    notesInternal: "VIP launch — confirm with Reuben that scallop is ok.",
    notesClient: null,
    timelineUrl: null,
    source: "web",
    createdAt: "2026-04-22T10:00:00Z",
    confirmedAt: null,
    cancelledAt: null,
    items: [],
  },
  {
    id: "b_1044",
    reference: "OLV-1044",
    status: "confirmed",
    clientId: null,
    vendorId: null,
    clientFullName: "Sophie & Sam",
    clientEmail: "sophie@example.com",
    clientPhone: "+64 21 555 4040",
    eventDate: "2026-06-22",
    deliveryDate: "2026-06-21",
    returnDate: "2026-06-23",
    deliveryAddress: "Wanaka Wines",
    deliveryCity: "Wanaka",
    deliveryRegion: "wanaka",
    deliveryWindow: "10 – 12pm",
    collectionWindow: "9 – 11am",
    onSiteContact: "Sophie — 021 555 4040",
    subtotalCents: 19100,
    discountCents: 0,
    deliveryFeeCents: 9500,
    totalCents: 28600,
    depositDueCents: 14300,
    depositPaidCents: 14300,
    finalDueCents: 28600,
    finalPaidCents: 0,
    finalDueDate: "2026-05-23",
    cutoffLocked: false,
    adminOverride: false,
    notesInternal: null,
    notesClient: null,
    timelineUrl: null,
    source: "web",
    createdAt: "2026-03-10T14:00:00Z",
    confirmedAt: "2026-03-11T09:00:00Z",
    cancelledAt: null,
    items: [],
  },
  {
    id: "b_1029",
    reference: "OLV-1029",
    status: "final_pending",
    clientId: null,
    vendorId: null,
    clientFullName: "Emma & Henning",
    clientEmail: "emma@example.com",
    clientPhone: null,
    eventDate: "2026-05-09",
    deliveryDate: "2026-05-08",
    returnDate: "2026-05-10",
    deliveryAddress: "Kelvin Heights",
    deliveryCity: "Queenstown",
    deliveryRegion: "queenstown",
    deliveryWindow: null,
    collectionWindow: null,
    onSiteContact: null,
    subtotalCents: 18200,
    discountCents: 0,
    deliveryFeeCents: 6500,
    totalCents: 24700,
    depositDueCents: 12350,
    depositPaidCents: 12350,
    finalDueCents: 24700,
    finalPaidCents: 6200,
    finalDueDate: "2026-04-09",
    cutoffLocked: true,
    adminOverride: false,
    notesInternal: "Final balance overdue — automation should pick up at next run.",
    notesClient: null,
    timelineUrl: null,
    source: "web",
    createdAt: "2026-01-05T10:00:00Z",
    confirmedAt: "2026-01-05T11:00:00Z",
    cancelledAt: null,
    items: [],
  },
];
