"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setDraftDates, setDraftDetails } from "./booking-draft";

/**
 * Server actions for the public-facing /hire/* booking flow.
 *
 * They mutate the cookie-stored draft and redirect onward.
 * `bookings.ts` carries the deeper domain helpers (deposit math, cutoff).
 */

const datesFormSchema = z.object({
  eventDate: z.string().min(1),
  deliveryDate: z.string().min(1),
  returnDate: z.string().min(1),
  region: z.string().optional().nullable(),
});

function hasValidBookingWindow({
  eventDate,
  deliveryDate,
  returnDate,
}: {
  eventDate: string;
  deliveryDate: string;
  returnDate: string;
}) {
  return deliveryDate <= eventDate && eventDate <= returnDate;
}

export async function saveBookingDates(formData: FormData) {
  const parsed = datesFormSchema.safeParse({
    eventDate: formData.get("eventDate"),
    deliveryDate: formData.get("deliveryDate"),
    returnDate: formData.get("returnDate"),
    region: formData.get("region"),
  });
  if (!parsed.success) {
    redirect("/hire/dates?error=invalid");
  }
  if (!hasValidBookingWindow(parsed.data)) {
    redirect("/hire/dates?error=window");
  }
  await setDraftDates(parsed.data);
  redirect("/hire/products");
}

const detailsFormSchema = z.object({
  venue: z.string().min(2),
  deliveryWindow: z.string().optional().nullable(),
  collectionWindow: z.string().optional().nullable(),
  onSiteContact: z.string().min(2),
  notes: z.string().optional().nullable(),
});

export async function saveBookingDetails(formData: FormData) {
  const parsed = detailsFormSchema.safeParse({
    venue: formData.get("venue"),
    deliveryWindow: formData.get("deliveryWindow"),
    collectionWindow: formData.get("collectionWindow"),
    onSiteContact: formData.get("onSiteContact"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    redirect("/hire/details?error=invalid");
  }
  await setDraftDetails(parsed.data);
  redirect("/hire/account");
}

/**
 * Set the quantity for a product in the draft.
 * - If quantity > 0 and the product isn't already in the draft, looks up
 *   the catalogue row and inserts a denormalised line.
 * - If quantity > 0 and the product IS in the draft, updates the count.
 * - If quantity === 0, removes the line.
 */
export async function updateDraftQuantity(productId: string, quantity: number) {
  const clamped = Math.max(0, Math.floor(quantity));
  const { getDraft, setDraftItemQuantity, addDraftItem } = await import("./booking-draft");

  const draft = await getDraft();
  const existing = draft.items.find((i) => i.productId === productId);

  if (existing || clamped === 0) {
    await setDraftItemQuantity(productId, clamped);
    revalidatePath("/hire/products");
    revalidatePath("/hire/quantities");
    return;
  }

  // New line — pull product info from the catalogue and insert.
  const { getProducts } = await import("./catalogue");
  const product = (await getProducts()).find((p) => p.id === productId);
  if (!product || typeof product.hirePriceCents !== "number") return;
  await addDraftItem({
    productId: product.id,
    slug: product.slug,
    name: product.name,
    colour: product.colour,
    fabric: product.fabric,
    heroImageUrl: product.heroImageUrl,
    unitPriceCents: product.hirePriceCents,
    quantity: clamped,
  });
  revalidatePath("/hire/products");
  revalidatePath("/hire/quantities");
  revalidatePath("/cart");
}
