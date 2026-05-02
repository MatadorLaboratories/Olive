"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "../_supabase-available";
import { addDays, format, parseISO } from "date-fns";
import { formatBookingReference } from "../bookings";

/**
 * Convert an enquiry into a draft booking row.
 *
 * Pre-populates name/email/phone/event_date from the enquiry and sets
 * `enquiries.converted_booking` so we can trace the relationship. Routes
 * the studio straight into the new booking detail, where they can finish
 * line items, pricing, and confirmation.
 */
export async function convertEnquiryToBooking(
  enquiryId: string,
): Promise<{ ok: false; error: string } | void> {
  if (!supabaseAvailable()) {
    return { ok: false, error: "Conversion needs Supabase configured." };
  }

  const admin = createSupabaseAdminClient();

  // 1. Pull the enquiry.
  const { data: enquiry, error } = await admin
    .from("enquiries")
    .select("id, name, email, phone, event_date, message, status, converted_booking")
    .eq("id", enquiryId)
    .maybeSingle();

  if (error || !enquiry) {
    return { ok: false, error: "Enquiry not found." };
  }

  // 2. If already converted, just re-route to the existing booking.
  type Row = {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    event_date: string | null;
    message: string | null;
    status: string;
    converted_booking: string | null;
  };
  const row = enquiry as unknown as Row;

  if (row.converted_booking) {
    redirect(`/admin/bookings/${row.converted_booking}`);
  }

  // 3. Compute draft fields. Bookings require an event window; default the
  //    delivery to event - 1 and return to event + 1 if the enquiry only
  //    gave us an event date. If no event date, push it 60 days out as a
  //    placeholder the studio will edit.
  const event = row.event_date ? parseISO(row.event_date) : addDays(new Date(), 60);
  const eventISO = format(event, "yyyy-MM-dd");
  const deliveryISO = format(addDays(event, -1), "yyyy-MM-dd");
  const returnISO = format(addDays(event, 1), "yyyy-MM-dd");

  const reference = formatBookingReference(
    Math.floor(1000 + Math.random() * 9000),
  );

  // 4. Insert the booking.
  type BookingInsert = {
    insert: (row: Record<string, unknown>) => {
      select: (col: string) => {
        single: () => Promise<{
          data: { id: string } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };

  const { data: bookingData, error: insertErr } = await (
    admin.from("bookings") as unknown as BookingInsert
  )
    .insert({
      reference,
      status: "enquiry",
      client_full_name: row.name,
      client_email: row.email,
      client_phone: row.phone,
      event_date: eventISO,
      delivery_date: deliveryISO,
      return_date: returnISO,
      notes_internal: `Converted from enquiry · ${row.email ?? "no email"}\n\n${row.message ?? ""}`,
      source: "enquiry",
    })
    .select("id")
    .single();

  if (insertErr || !bookingData) {
    return {
      ok: false,
      error: insertErr?.message ?? "Could not create the booking.",
    };
  }

  // 5. Mark enquiry as converted.
  type EnquiryUpdate = {
    update: (row: Record<string, unknown>) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
  await (admin.from("enquiries") as unknown as EnquiryUpdate)
    .update({ status: "converted", converted_booking: bookingData.id })
    .eq("id", row.id);

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/bookings");
  redirect(`/admin/bookings/${bookingData.id}`);
}

/**
 * Mark an enquiry as in-progress without converting (e.g. after sending a
 * mailto-style reply). Keeps the inbox accurate.
 */
export async function markEnquiryInProgress(
  enquiryId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseAvailable()) return { ok: true };

  const admin = createSupabaseAdminClient();
  type EnquiryUpdate = {
    update: (row: Record<string, unknown>) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { error } = await (admin.from("enquiries") as unknown as EnquiryUpdate)
    .update({ status: "in_progress" })
    .eq("id", enquiryId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/enquiries");
  return { ok: true };
}
