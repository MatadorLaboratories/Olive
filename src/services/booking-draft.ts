import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";

/**
 * Booking draft — the in-progress booking carried across the /hire/* flow.
 * Stored in an HTTP-only cookie as JSON. Lives until the booking is created
 * (then cleared) or 7 days, whichever comes first.
 *
 * Once a draft is upgraded to a real `bookings` row in Phase 2 / 3 the cookie
 * is discarded and the user follows their booking via the client portal.
 */

const COOKIE_NAME = "olv_draft";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const itemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  colour: z.string().nullable(),
  fabric: z.string().nullable(),
  heroImageUrl: z.string().nullable(),
  unitPriceCents: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
});

const datesSchema = z.object({
  eventDate: z.string(),       // YYYY-MM-DD
  deliveryDate: z.string(),
  returnDate: z.string(),
  region: z.string().optional().nullable(),
});

const detailsSchema = z.object({
  venue: z.string().optional().nullable(),
  deliveryWindow: z.string().optional().nullable(),
  collectionWindow: z.string().optional().nullable(),
  onSiteContact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const draftSchema = z.object({
  v: z.literal(1),
  dates: datesSchema.nullable(),
  details: detailsSchema.nullable(),
  items: z.array(itemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BookingDraft = z.infer<typeof draftSchema>;
export type DraftItem = z.infer<typeof itemSchema>;
export type DraftDates = z.infer<typeof datesSchema>;
export type DraftDetails = z.infer<typeof detailsSchema>;

const empty: BookingDraft = {
  v: 1,
  dates: null,
  details: null,
  items: [],
  createdAt: "",
  updatedAt: "",
};

// --------- read / write ---------

export async function getDraft(): Promise<BookingDraft> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return { ...empty };
  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { ...empty };
    return parsed.data;
  } catch {
    return { ...empty };
  }
}

export async function setDraft(draft: BookingDraft) {
  const store = await cookies();
  const next: BookingDraft = {
    ...draft,
    createdAt: draft.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.set({
    name: COOKIE_NAME,
    value: JSON.stringify(next),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearDraft() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// --------- mutations ---------

export async function setDraftDates(input: DraftDates) {
  const draft = await getDraft();
  await setDraft({ ...draft, dates: input });
}

export async function setDraftDetails(input: DraftDetails) {
  const draft = await getDraft();
  await setDraft({ ...draft, details: input });
}

export async function addDraftItem(item: DraftItem) {
  const draft = await getDraft();
  const existing = draft.items.find((i) => i.productId === item.productId);
  const items = existing
    ? draft.items.map((i) =>
        i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i,
      )
    : [...draft.items, item];
  await setDraft({ ...draft, items });
}

export async function setDraftItemQuantity(productId: string, quantity: number) {
  const draft = await getDraft();
  const items = quantity <= 0
    ? draft.items.filter((i) => i.productId !== productId)
    : draft.items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
  await setDraft({ ...draft, items });
}

export async function removeDraftItem(productId: string) {
  await setDraftItemQuantity(productId, 0);
}

// --------- derived totals ---------

export function draftSubtotalCents(draft: BookingDraft): number {
  return draft.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
}

export function draftDeliveryFeeCents(draft: BookingDraft): number {
  // Phase-2 baseline — flat regional fee; admin pricing module overrides in Phase 3.
  if (!draft.dates?.region) return 0;
  switch (draft.dates.region) {
    case "queenstown": return 6500;
    case "arrowtown":
    case "wanaka":     return 9500;
    case "central-otago": return 14500;
    default:           return 19500; // "elsewhere — quote"
  }
}

export function draftDiscountCents(draft: BookingDraft, discountPct: number): number {
  if (discountPct <= 0) return 0;
  return Math.round((draftSubtotalCents(draft) * discountPct) / 100);
}

export function draftTotalCents(draft: BookingDraft, discountPct = 0): number {
  return draftSubtotalCents(draft) - draftDiscountCents(draft, discountPct) + draftDeliveryFeeCents(draft);
}

export function draftItemCount(draft: BookingDraft): number {
  return draft.items.reduce((sum, i) => sum + i.quantity, 0);
}
