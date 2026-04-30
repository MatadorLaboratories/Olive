import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "./_supabase-available";
import { seedBookings } from "@/data/seed/bookings";
import type { Booking, BookingItem } from "@/types/domain";

export type BookingWithItems = Booking & { items: BookingItem[] };

/**
 * Read-side bookings service — used by the client portal, trade portal, and
 * admin booking list. Falls back to seed bookings in demo mode so the portal
 * has content immediately.
 */
export async function getBookingsForCurrentUser(): Promise<BookingWithItems[]> {
  if (!supabaseAvailable()) return seedBookings;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select("*, booking_items(*)")
    .eq("client_id", user.id)
    .order("event_date", { ascending: true });

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map(rowToBooking);
}

export async function getBookingByReference(reference: string): Promise<BookingWithItems | null> {
  if (!supabaseAvailable()) {
    return seedBookings.find((b) => b.reference === reference) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, booking_items(*)")
    .eq("reference", reference)
    .maybeSingle();

  if (error || !data) return null;
  return rowToBooking(data as Record<string, unknown>);
}

// ----- mappers -----
function rowToBooking(row: Record<string, unknown>): BookingWithItems {
  const items = (row.booking_items as Array<Record<string, unknown>> | undefined)?.map(rowToItem) ?? [];
  return {
    id: String(row.id),
    reference: String(row.reference),
    status: row.status as Booking["status"],
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

function rowToItem(row: Record<string, unknown>): BookingItem {
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    productId: String(row.product_id),
    quantity: Number(row.quantity),
    unitPriceCents: Number(row.unit_price_cents),
    lineTotalCents: Number(row.line_total_cents),
    notes: (row.notes as string | null) ?? null,
  };
}
