import type { Booking, BookingItem } from "@/types/domain";

/**
 * Seed bookings — used by the client portal in demo mode (no DB connected).
 * The "demo client" sees these as their own; real users see their actual rows
 * once Supabase is connected.
 */

export const seedBookings: Array<Booking & { items: BookingItem[] }> = [
  {
    id: "b_1042",
    reference: "OLV-1042",
    status: "confirmed",
    clientId: "demo-client",
    vendorId: null,
    clientFullName: "Charlotte Eames",
    clientEmail: "charlotte@eamesco.nz",
    clientPhone: "+64 27 000 0000",
    eventDate: "2026-06-14",
    deliveryDate: "2026-06-13",
    returnDate: "2026-06-15",
    deliveryAddress: "Glenorchy Estate",
    deliveryCity: "Glenorchy",
    deliveryRegion: "queenstown",
    deliveryWindow: "9 – 11am",
    collectionWindow: "10am – 12pm",
    onSiteContact: "Charlotte Eames — 027 000 0000",
    subtotalCents: 14200,
    discountCents: 0,
    deliveryFeeCents: 6500,
    totalCents: 20700,
    depositDueCents: 10350,
    depositPaidCents: 10350,
    finalDueCents: 10350,
    finalPaidCents: 0,
    finalDueDate: "2026-05-15",
    cutoffLocked: false,
    adminOverride: false,
    notesInternal: null,
    notesClient: "Long-table autumn wedding for ninety. Cream cloth + bone scallops + olive runner.",
    timelineUrl: null,
    source: "web",
    createdAt: "2026-02-08T10:00:00Z",
    confirmedAt: "2026-02-08T10:30:00Z",
    cancelledAt: null,
    items: [
      {
        id: "bi_1042_a",
        bookingId: "b_1042",
        productId: "p_scallop_napkin_bone",
        quantity: 90,
        unitPriceCents: 350,
        lineTotalCents: 31500,
        notes: null,
      },
      {
        id: "bi_1042_b",
        bookingId: "b_1042",
        productId: "p_long_tablecloth_cream",
        quantity: 9,
        unitPriceCents: 4500,
        lineTotalCents: 40500,
        notes: null,
      },
      {
        id: "bi_1042_c",
        bookingId: "b_1042",
        productId: "p_runner_olive",
        quantity: 9,
        unitPriceCents: 1800,
        lineTotalCents: 16200,
        notes: null,
      },
    ],
  },
];
