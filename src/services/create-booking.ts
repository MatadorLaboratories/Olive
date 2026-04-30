"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "./_supabase-available";
import {
  draftDeliveryFeeCents,
  draftDiscountCents,
  draftSubtotalCents,
  draftTotalCents,
  type BookingDraft,
} from "./booking-draft";
import {
  depositDueCents,
  finalDueCents,
  finalDueDate,
  formatBookingReference,
} from "./bookings";
import { createDepositIntent, getStripe } from "./payments";
import { getVendorContext } from "./vendor";

export type CreateBookingResult =
  | { ok: true; reference: string; clientSecret: string | null; bookingId: string | null; demo: boolean }
  | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasValidBookingWindow(dates: BookingDraft["dates"]) {
  if (!dates) return false;
  return dates.deliveryDate <= dates.eventDate && dates.eventDate <= dates.returnDate;
}

type NormalizedDraftItem = {
  productId: string;
  quantity: number;
  unitPriceCents: number;
};

function sortNormalizedItems(items: NormalizedDraftItem[]) {
  return [...items].sort((a, b) => a.productId.localeCompare(b.productId));
}

function sameNormalizedItems(
  existing: Array<{ product_id: string; quantity: number; unit_price_cents: number }>,
  next: NormalizedDraftItem[],
) {
  if (existing.length !== next.length) return false;
  const left = [...existing].sort((a, b) => a.product_id.localeCompare(b.product_id));
  const right = sortNormalizedItems(next);
  return left.every((item, index) => {
    const compare = right[index];
    if (!compare) return false;
    return (
      item.product_id === compare.productId &&
      item.quantity === compare.quantity &&
      item.unit_price_cents === compare.unitPriceCents
    );
  });
}

/**
 * Create a booking from the cookie draft.
 *
 * Returns a Stripe `client_secret` so the deposit page can mount the
 * Payment Element. The booking row starts at status `deposit_pending` and
 * flips to `confirmed` via the Stripe webhook on payment success.
 *
 * In demo mode (no Supabase or no Stripe), we return a synthetic reference
 * + null clientSecret so the UI can show a "demo confirmation".
 */
export async function createBookingFromDraft(draft: BookingDraft): Promise<CreateBookingResult> {
  if (!draft.dates || draft.items.length === 0 || !draft.details) {
    return { ok: false, error: "Your booking is missing required information." };
  }
  if (!hasValidBookingWindow(draft.dates)) {
    return {
      ok: false,
      error: "Please check your delivery, event, and return dates. Delivery must be before the event, and collection after it.",
    };
  }

  const vendor = await getVendorContext();
  const discountPct = vendor?.status === "approved" ? vendor.discountPct : 0;

  const subtotal = draftSubtotalCents(draft);
  const discount = draftDiscountCents(draft, discountPct);
  const delivery = draftDeliveryFeeCents(draft);
  const total = draftTotalCents(draft, discountPct);
  const deposit = depositDueCents(total);
  const finalAmount = finalDueCents(total, 0);
  const finalDate = finalDueDate(draft.dates.eventDate);

  const demoMode = !supabaseAvailable() || !process.env.STRIPE_SECRET_KEY;

  // ----- Demo mode: skip DB + Stripe; return a synthetic reference -----
  if (demoMode) {
    const reference = formatBookingReference(Math.floor(1000 + Math.random() * 9000));
    return { ok: true, reference, clientSecret: null, bookingId: null, demo: true };
  }

  // ----- Real path: insert booking + items, create PaymentIntent -----
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in to confirm a booking." };

  type ProfileUpsert = {
    upsert: (
      row: Record<string, unknown>,
      options?: { onConflict?: string },
    ) => Promise<{ data: { id: string }[] | null; error: { message?: string | null; code?: string | null; details?: string | null; hint?: string | null } | null }>;
  };

  const profileResult = await (admin.from("profiles") as unknown as ProfileUpsert).upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: user.user_metadata?.full_name ?? null,
    },
    { onConflict: "id" },
  );

  if (profileResult.error) {
    console.error("[createBooking] profile upsert failed", {
      message: profileResult.error.message,
      code: profileResult.error.code,
      details: profileResult.error.details,
      hint: profileResult.error.hint,
      userId: user.id,
      email: user.email ?? null,
    });
    return { ok: false, error: "We couldn't finish setting up your account. Please try signing in again." };
  }

  // Resolve product ids before we try to reuse or create a booking.
  type ProductLookupRow = { id: string; slug: string };
  const productLookup = await admin
    .from("products")
    .select("id, slug")
    .in("slug", [...new Set(draft.items.map((item) => item.slug))])
    .eq("status", "active");

  if (productLookup.error) {
    console.error("[createBooking] product lookup failed", productLookup.error);
    return { ok: false, error: "Couldn't validate your selected linen. Please try again." };
  }

  const productIdBySlug = new Map(
    ((productLookup.data ?? []) as ProductLookupRow[]).map((row) => [row.slug, row.id]),
  );

  const normalizedItems: NormalizedDraftItem[] = [];
  for (const it of draft.items) {
    const resolvedProductId =
      UUID_RE.test(it.productId) && productIdBySlug.get(it.slug) === it.productId
        ? it.productId
        : productIdBySlug.get(it.slug);

    if (!resolvedProductId) {
      console.error("[createBooking] product resolution failed", {
        slug: it.slug,
        draftProductId: it.productId,
      });
      return { ok: false, error: "One of your selected products is no longer available. Please reselect your linen." };
    }

    normalizedItems.push({
      productId: resolvedProductId,
      quantity: it.quantity,
      unitPriceCents: it.unitPriceCents,
    });
  }

  type ExistingBookingRow = {
    id: string;
    reference: string;
    subtotal_cents: number;
    discount_cents: number;
    delivery_fee_cents: number;
    total_cents: number;
    deposit_due_cents: number;
    delivery_region: string | null;
    delivery_address: string | null;
    delivery_window: string | null;
    collection_window: string | null;
    on_site_contact: string | null;
    notes_client: string | null;
    source: string | null;
    booking_items?: Array<{
      product_id: string;
      quantity: number;
      unit_price_cents: number;
    }>;
    payments?: Array<{
      kind: string;
      status: string;
      stripe_payment_intent: string | null;
    }>;
  };

  const existingBookingLookup = await admin
    .from("bookings")
    .select(`
      id,
      reference,
      subtotal_cents,
      discount_cents,
      delivery_fee_cents,
      total_cents,
      deposit_due_cents,
      delivery_region,
      delivery_address,
      delivery_window,
      collection_window,
      on_site_contact,
      notes_client,
      source,
      booking_items(product_id, quantity, unit_price_cents),
      payments(kind, status, stripe_payment_intent)
    `)
    .eq("client_id", user.id)
    .eq("status", "deposit_pending")
    .eq("event_date", draft.dates.eventDate)
    .eq("delivery_date", draft.dates.deliveryDate)
    .eq("return_date", draft.dates.returnDate)
    .order("created_at", { ascending: false })
    .limit(5);

  if (existingBookingLookup.error) {
    console.error("[createBooking] existing booking lookup failed", existingBookingLookup.error);
  } else {
    const existingMatch = ((existingBookingLookup.data ?? []) as unknown as ExistingBookingRow[]).find((row) => {
      return (
        row.subtotal_cents === subtotal &&
        row.discount_cents === discount &&
        row.delivery_fee_cents === delivery &&
        row.total_cents === total &&
        row.deposit_due_cents === deposit &&
        (row.delivery_region ?? null) === (draft.dates?.region ?? null) &&
        (row.delivery_address ?? null) === (draft.details?.venue ?? null) &&
        (row.delivery_window ?? null) === (draft.details?.deliveryWindow ?? null) &&
        (row.collection_window ?? null) === (draft.details?.collectionWindow ?? null) &&
        (row.on_site_contact ?? null) === (draft.details?.onSiteContact ?? null) &&
        (row.notes_client ?? null) === (draft.details?.notes ?? null) &&
        (row.source ?? "web") === (vendor ? "vendor-portal" : "web") &&
        sameNormalizedItems(row.booking_items ?? [], normalizedItems)
      );
    });

    if (existingMatch) {
      const existingPayment = (existingMatch.payments ?? []).find(
        (payment) => payment.kind === "deposit" && payment.status === "pending" && payment.stripe_payment_intent,
      );

      if (existingPayment?.stripe_payment_intent) {
        try {
          const stripe = getStripe();
          const intent = await stripe.paymentIntents.retrieve(existingPayment.stripe_payment_intent);
          return {
            ok: true,
            reference: existingMatch.reference,
            bookingId: existingMatch.id,
            clientSecret: intent.client_secret,
            demo: false,
          };
        } catch (error) {
          console.error("[createBooking] existing payment intent retrieve failed", error);
        }
      }
    }
  }

  // Generate a soft reference; production version uses a DB sequence.
  const reference = formatBookingReference(Math.floor(1000 + Math.random() * 9000));

  // Use the admin client so we can write through RLS without granting clients
  // direct insert rights into bookings/booking_items.
  type BookingInsert = {
    insert: (row: Record<string, unknown>) => {
      select: (col: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> };
    };
  };

  const bookingResult = await (admin.from("bookings") as unknown as BookingInsert)
    .insert({
      reference,
      status: "deposit_pending",
      client_id: user.id,
      vendor_id: vendor?.status === "approved" ? vendor.id : null,
      client_full_name: user.user_metadata?.full_name ?? null,
      client_email: user.email ?? null,
      event_date: draft.dates.eventDate,
      delivery_date: draft.dates.deliveryDate,
      return_date: draft.dates.returnDate,
      delivery_address: draft.details.venue,
      delivery_region: draft.dates.region,
      delivery_window: draft.details.deliveryWindow,
      collection_window: draft.details.collectionWindow,
      on_site_contact: draft.details.onSiteContact,
      subtotal_cents: subtotal,
      discount_cents: discount,
      delivery_fee_cents: delivery,
      total_cents: total,
      deposit_due_cents: deposit,
      final_due_cents: finalAmount,
      final_due_date: finalDate,
      notes_client: draft.details.notes,
      source: vendor ? "vendor-portal" : "web",
    })
    .select("id")
    .single();

  if (bookingResult.error || !bookingResult.data) {
    console.error("[createBooking] insert failed", {
      message: bookingResult.error?.message ?? null,
      code: "code" in (bookingResult.error ?? {}) ? (bookingResult.error as { code?: string | null }).code ?? null : null,
      details: "details" in (bookingResult.error ?? {}) ? (bookingResult.error as { details?: string | null }).details ?? null : null,
      hint: "hint" in (bookingResult.error ?? {}) ? (bookingResult.error as { hint?: string | null }).hint ?? null : null,
      reference,
      userId: user.id,
      dates: draft.dates,
    });
    return { ok: false, error: "Could not create the booking. Please try again." };
  }

  const bookingId = bookingResult.data.id;

  type ItemsInsert = { insert: (rows: Array<Record<string, unknown>>) => Promise<{ error: { message: string } | null }> };
  type DeleteOp = { delete: () => { eq: (col: string, val: string) => Promise<unknown> } };
  const items = [];
  for (const it of normalizedItems) {
    items.push({
      booking_id: bookingId,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price_cents: it.unitPriceCents,
      line_total_cents: it.unitPriceCents * it.quantity,
    });
  }

  const itemsResult = await (admin.from("booking_items") as unknown as ItemsInsert).insert(items);
  if (itemsResult.error) {
    console.error("[createBooking] items insert failed", {
      message: itemsResult.error.message,
      details: itemsResult.error,
    });
    // Best-effort cleanup (no transaction primitive in supabase-js).
    await (admin.from("bookings") as unknown as DeleteOp).delete().eq("id", bookingId);
    return { ok: false, error: "Could not save line items. Please try again." };
  }

  // Create the Stripe PaymentIntent for the deposit.
  let clientSecret: string | null = null;
  try {
    const intent = await createDepositIntent({
      amountCents: deposit,
      bookingReference: reference,
      customerEmail: user.email ?? "",
    });
    clientSecret = intent.client_secret;

    type PayInsert = { insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
    await (admin.from("payments") as unknown as PayInsert).insert({
      booking_id: bookingId,
      kind: "deposit",
      status: "pending",
      amount_cents: deposit,
      currency: "NZD",
      stripe_payment_intent: intent.id,
    });
  } catch (e) {
    console.error("[createBooking] stripe failed", e);
    return { ok: false, error: "Couldn't set up the deposit payment. Please try again." };
  }

  return { ok: true, reference, bookingId, clientSecret, demo: false };
}
