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
    subtotalCents: 312000,
    discountCents: 0,
    deliveryFeeCents: 9500,
    totalCents: 321500,
    depositDueCents: 160750,
    depositPaidCents: 0,
    finalDueCents: 321500,
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
    subtotalCents: 226000,
    discountCents: 0,
    deliveryFeeCents: 9500,
    totalCents: 235500,
    depositDueCents: 117750,
    depositPaidCents: 117750,
    finalDueCents: 117750,
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
    subtotalCents: 142000,
    discountCents: 0,
    deliveryFeeCents: 6500,
    totalCents: 148500,
    depositDueCents: 74250,
    depositPaidCents: 74250,
    finalDueCents: 74250,
    finalPaidCents: 18000,
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
  // ----- Additional realistic bookings to populate the revenue chart -----
  // Mix of weddings (Q'town/Wanaka/Glenorchy) and commercial linen for
  // hospitality clients (Ayrburn, Sherwood). Values reflect typical NZ
  // wedding-linen totals — $1,500–$5,000 per booking with delivery.
  bookingShell({
    id: "b_1015",
    reference: "OLV-1015",
    status: "delivered",
    name: "Anna & Ben",
    address: "Cardrona Distillery",
    city: "Cardrona",
    region: "wanaka",
    eventDate: "2025-12-13",
    deliveryDate: "2025-12-12",
    returnDate: "2025-12-14",
    subtotal: 462000,
    delivery: 9500,
    depositPaid: 235750,
    finalPaid: 235750,
    createdAt: "2025-11-22T09:30:00Z",
    confirmedAt: "2025-11-23T10:00:00Z",
    finalDueDate: "2025-11-13",
    notesInternal: "Repeat planner — confirm scallop set + olive runners.",
  }),
  bookingShell({
    id: "b_1018",
    reference: "OLV-1018",
    status: "delivered",
    name: "Tussock Catering",
    address: "Arrowtown",
    city: "Arrowtown",
    region: "queenstown",
    eventDate: "2025-12-21",
    deliveryDate: "2025-12-20",
    returnDate: "2025-12-22",
    subtotal: 118000,
    delivery: 6500,
    depositPaid: 62250,
    finalPaid: 62250,
    createdAt: "2025-12-04T14:00:00Z",
    confirmedAt: "2025-12-04T16:00:00Z",
    finalDueDate: "2025-12-14",
  }),
  bookingShell({
    id: "b_1019",
    reference: "OLV-1019",
    status: "delivered",
    name: "Beatrice & Theo",
    address: "Glenorchy Estate",
    city: "Glenorchy",
    region: "queenstown",
    eventDate: "2026-01-18",
    deliveryDate: "2026-01-17",
    returnDate: "2026-01-19",
    subtotal: 376000,
    delivery: 6500,
    depositPaid: 191250,
    finalPaid: 191250,
    createdAt: "2026-01-04T09:00:00Z",
    confirmedAt: "2026-01-05T09:00:00Z",
    finalDueDate: "2025-12-19",
  }),
  bookingShell({
    id: "b_1022",
    reference: "OLV-1022",
    status: "delivered",
    name: "Sherwood Hospitality",
    address: "Sherwood Queenstown",
    city: "Queenstown",
    region: "queenstown",
    eventDate: "2026-01-24",
    deliveryDate: "2026-01-23",
    returnDate: "2026-01-25",
    subtotal: 211000,
    delivery: 6500,
    depositPaid: 108750,
    finalPaid: 108750,
    createdAt: "2026-01-09T10:00:00Z",
    confirmedAt: "2026-01-09T11:30:00Z",
    finalDueDate: "2025-12-25",
    notesInternal: "Branded napkins — repeat order. Quarterly run.",
  }),
  bookingShell({
    id: "b_1023",
    reference: "OLV-1023",
    status: "delivered",
    name: "Olivia & James",
    address: "Rippon Vineyard",
    city: "Wanaka",
    region: "wanaka",
    eventDate: "2026-01-31",
    deliveryDate: "2026-01-30",
    returnDate: "2026-02-01",
    subtotal: 258000,
    delivery: 9500,
    depositPaid: 133750,
    finalPaid: 133750,
    createdAt: "2026-01-16T14:00:00Z",
    confirmedAt: "2026-01-17T09:00:00Z",
    finalDueDate: "2026-01-01",
  }),
  bookingShell({
    id: "b_1025",
    reference: "OLV-1025",
    status: "delivered",
    name: "Ayrburn Group",
    address: "Ayrburn",
    city: "Arrowtown",
    region: "queenstown",
    eventDate: "2026-02-14",
    deliveryDate: "2026-02-13",
    returnDate: "2026-02-15",
    subtotal: 332000,
    delivery: 6500,
    depositPaid: 169250,
    finalPaid: 169250,
    createdAt: "2026-02-02T10:00:00Z",
    confirmedAt: "2026-02-02T12:00:00Z",
    finalDueDate: "2026-01-15",
    notesInternal: "Ayrburn — hospitality build, recurring.",
  }),
  bookingShell({
    id: "b_1027",
    reference: "OLV-1027",
    status: "delivered",
    name: "Iris & Hugo",
    address: "Millbrook Resort",
    city: "Arrowtown",
    region: "queenstown",
    eventDate: "2026-02-28",
    deliveryDate: "2026-02-27",
    returnDate: "2026-03-01",
    subtotal: 294000,
    delivery: 6500,
    depositPaid: 150250,
    finalPaid: 150250,
    createdAt: "2026-02-15T09:00:00Z",
    confirmedAt: "2026-02-16T09:00:00Z",
    finalDueDate: "2026-01-29",
  }),
  bookingShell({
    id: "b_1031",
    reference: "OLV-1031",
    status: "delivered",
    name: "Stella & Marcus",
    address: "Glenorchy Hall",
    city: "Glenorchy",
    region: "queenstown",
    eventDate: "2026-03-15",
    deliveryDate: "2026-03-14",
    returnDate: "2026-03-16",
    subtotal: 232000,
    delivery: 6500,
    depositPaid: 119250,
    finalPaid: 119250,
    createdAt: "2026-03-01T10:00:00Z",
    confirmedAt: "2026-03-02T10:00:00Z",
    finalDueDate: "2026-02-13",
  }),
  bookingShell({
    id: "b_1033",
    reference: "OLV-1033",
    status: "delivered",
    name: "Sherwood Hospitality",
    address: "Sherwood Queenstown",
    city: "Queenstown",
    region: "queenstown",
    eventDate: "2026-03-21",
    deliveryDate: "2026-03-20",
    returnDate: "2026-03-22",
    subtotal: 162000,
    delivery: 6500,
    depositPaid: 84250,
    finalPaid: 84250,
    createdAt: "2026-03-08T11:00:00Z",
    confirmedAt: "2026-03-08T14:00:00Z",
    finalDueDate: "2026-02-19",
    notesInternal: "Autumn series — branded napkins.",
  }),
  bookingShell({
    id: "b_1035",
    reference: "OLV-1035",
    status: "delivered",
    name: "Ruby & Felix",
    address: "Northburn Station",
    city: "Cromwell",
    region: "central-otago",
    eventDate: "2026-03-28",
    deliveryDate: "2026-03-27",
    returnDate: "2026-03-29",
    subtotal: 286000,
    delivery: 12500,
    depositPaid: 149250,
    finalPaid: 149250,
    createdAt: "2026-03-15T09:00:00Z",
    confirmedAt: "2026-03-16T10:00:00Z",
    finalDueDate: "2026-02-26",
  }),
  bookingShell({
    id: "b_1037",
    reference: "OLV-1037",
    status: "delivered",
    name: "Hanmer Springs Resort",
    address: "Hanmer Springs",
    city: "Hanmer",
    region: "canterbury",
    eventDate: "2026-04-11",
    deliveryDate: "2026-04-10",
    returnDate: "2026-04-12",
    subtotal: 138000,
    delivery: 14500,
    depositPaid: 76250,
    finalPaid: 76250,
    createdAt: "2026-04-01T09:00:00Z",
    confirmedAt: "2026-04-01T15:00:00Z",
    finalDueDate: "2026-03-12",
    notesInternal: "Commercial — opening event.",
  }),
  bookingShell({
    id: "b_1039",
    reference: "OLV-1039",
    status: "confirmed",
    name: "Lila & Theo",
    address: "Arrowtown Hall",
    city: "Arrowtown",
    region: "queenstown",
    eventDate: "2026-05-30",
    deliveryDate: "2026-05-29",
    returnDate: "2026-05-31",
    subtotal: 312000,
    delivery: 6500,
    depositPaid: 159250,
    finalPaid: 0,
    createdAt: "2026-04-18T10:00:00Z",
    confirmedAt: "2026-04-19T09:00:00Z",
    finalDueDate: "2026-04-30",
    notesInternal: "Final balance overdue — chase before delivery.",
  }),
  // ----- Upcoming deliveries (next 14 days) so the dashboard's
  //       "Today & this week" + 30-day count populate properly. -----
  bookingShell({
    id: "b_1045",
    reference: "OLV-1045",
    status: "confirmed",
    name: "Saoirse & Eli",
    address: "The Camp Glenorchy",
    city: "Glenorchy",
    region: "queenstown",
    eventDate: "2026-05-16",
    deliveryDate: "2026-05-15",
    returnDate: "2026-05-17",
    subtotal: 268000,
    delivery: 6500,
    depositPaid: 137250,
    finalPaid: 137250,
    createdAt: "2026-05-02T09:30:00Z",
    confirmedAt: "2026-05-02T11:00:00Z",
    finalDueDate: "2026-04-16",
  }),
  bookingShell({
    id: "b_1046",
    reference: "OLV-1046",
    status: "confirmed",
    name: "Ayrburn Group",
    address: "Ayrburn",
    city: "Arrowtown",
    region: "queenstown",
    eventDate: "2026-05-19",
    deliveryDate: "2026-05-18",
    returnDate: "2026-05-20",
    subtotal: 184000,
    delivery: 6500,
    depositPaid: 95250,
    finalPaid: 95250,
    createdAt: "2026-05-04T10:00:00Z",
    confirmedAt: "2026-05-04T11:30:00Z",
    finalDueDate: "2026-04-19",
    notesInternal: "Branded napkins — May service round.",
  }),
  bookingShell({
    id: "b_1047",
    reference: "OLV-1047",
    status: "confirmed",
    name: "Cordelia & James",
    address: "Northburn Station",
    city: "Cromwell",
    region: "central-otago",
    eventDate: "2026-05-23",
    deliveryDate: "2026-05-22",
    returnDate: "2026-05-24",
    subtotal: 342000,
    delivery: 12500,
    depositPaid: 177250,
    finalPaid: 0,
    createdAt: "2026-05-06T14:00:00Z",
    confirmedAt: "2026-05-07T09:00:00Z",
    finalDueDate: "2026-04-23",
  }),
];

/**
 * Lightweight helper for repeat-shape bookings — keeps the list above
 * readable without copy-pasting every defaulted field.
 */
function bookingShell(p: {
  id: string;
  reference: string;
  status: BookingWithItems["status"];
  name: string;
  address: string;
  city: string;
  region: string;
  eventDate: string;
  deliveryDate: string;
  returnDate: string;
  subtotal: number;
  delivery: number;
  depositPaid: number;
  finalPaid: number;
  createdAt: string;
  confirmedAt: string | null;
  finalDueDate: string;
  notesInternal?: string;
}): BookingWithItems {
  const total = p.subtotal + p.delivery;
  return {
    id: p.id,
    reference: p.reference,
    status: p.status,
    clientId: null,
    vendorId: null,
    clientFullName: p.name,
    clientEmail: null,
    clientPhone: null,
    eventDate: p.eventDate,
    deliveryDate: p.deliveryDate,
    returnDate: p.returnDate,
    deliveryAddress: p.address,
    deliveryCity: p.city,
    deliveryRegion: p.region,
    deliveryWindow: null,
    collectionWindow: null,
    onSiteContact: null,
    subtotalCents: p.subtotal,
    discountCents: 0,
    deliveryFeeCents: p.delivery,
    totalCents: total,
    depositDueCents: Math.round(total / 2),
    depositPaidCents: p.depositPaid,
    finalDueCents: Math.round(total / 2),
    finalPaidCents: p.finalPaid,
    finalDueDate: p.finalDueDate,
    cutoffLocked: true,
    adminOverride: false,
    notesInternal: p.notesInternal ?? null,
    notesClient: null,
    timelineUrl: null,
    source: "web",
    createdAt: p.createdAt,
    confirmedAt: p.confirmedAt,
    cancelledAt: null,
    items: [],
  };
}
