import type { Product } from "@/types/domain";

/**
 * Seed catalogue.
 *
 * Used by the data services layer when Supabase isn't connected. Once a
 * future buyer / admin populates the DB via /admin/products, the live
 * rows take over without code changes.
 *
 * Each entry mirrors the `products` table column shape (camelCased).
 *
 * Imagery: real product photography lives at `public-media/products/{slug}/...`
 * in Supabase Storage (uploaded May 2026). Products without a confident
 * match in that shoot keep `heroImageUrl: null` and degrade to a neutral
 * placeholder in the UI — never stock photos. See
 * `docs/product-photography-mapping.md`.
 */
const PRODUCT_MEDIA =
  "https://akaxacpjrqmtwwmnecav.supabase.co/storage/v1/object/public/public-media/products";

export const seedProducts: Product[] = [
  {
    id: "p_scallop_napkin_bone",
    slug: "scallop-napkin-bone",
    kind: "both",
    status: "active",
    name: "Scallop napkin",
    category: "napkin",
    fabric: "100% French linen, scallop edge",
    colour: "Bone",
    size: "50 × 50 cm",
    description:
      "The original Olive scallop. Hand-finished scallop edge, washed soft, in a warm bone tone that quietly disappears into a wedding palette without ever being beige. Sold and hired in sets of ten.",
    shortDescription: "Hand-scalloped 100% French linen — the original Olive napkin.",
    heroImageUrl: null,
    galleryUrls: [],
    hirePriceCents: 350,
    retailPriceCents: 1800,
    replacementCostCents: 4200,
    displayOrder: 10,
  },
  {
    id: "p_scallop_napkin_clay",
    slug: "scallop-napkin-clay",
    kind: "both",
    status: "active",
    name: "Scallop napkin",
    category: "napkin",
    fabric: "100% French linen, scallop edge",
    colour: "Clay",
    size: "50 × 50 cm",
    description:
      "The scallop in clay — warm terracotta with the slightest pink. Reads softer than terracotta in candlelight, holds presence on a long table.",
    shortDescription: "Warm-terracotta scallop — softens beautifully in candlelight.",
    heroImageUrl: null,
    galleryUrls: [],
    hirePriceCents: 350,
    retailPriceCents: 1800,
    replacementCostCents: 4200,
    displayOrder: 20,
  },
  {
    id: "p_scallop_napkin_olive",
    slug: "scallop-napkin-olive",
    kind: "both",
    status: "active",
    name: "Scallop napkin",
    category: "napkin",
    fabric: "100% French linen, scallop edge",
    colour: "Olive",
    size: "50 × 50 cm",
    description:
      "Deep dusted olive — a quietly moody scallop for autumn weddings, hospitality launches and the kind of dinner that ends well past midnight.",
    shortDescription: "The house olive. Quiet, moody, surprisingly versatile.",
    heroImageUrl: `${PRODUCT_MEDIA}/scallop-napkin-olive/hero-1778153501229-1E9A2259_Sml.jpg`,
    galleryUrls: [
      `${PRODUCT_MEDIA}/scallop-napkin-olive/gallery-1-1778153502587-1E9A2379_Sml.jpg`,
    ],
    hirePriceCents: 350,
    retailPriceCents: 1800,
    replacementCostCents: 4200,
    displayOrder: 30,
  },
  {
    id: "p_plain_napkin_oat",
    slug: "plain-napkin-oat",
    kind: "hire",
    status: "active",
    name: "Plain napkin",
    category: "napkin",
    fabric: "Stonewashed linen, mitred edge",
    colour: "Oat",
    size: "50 × 50 cm",
    description:
      "The everyday napkin made beautiful. Heavyweight stonewashed linen with a clean mitred edge — meant for dinners that don't need to perform.",
    shortDescription: "The everyday napkin, in stonewashed oat.",
    heroImageUrl: `${PRODUCT_MEDIA}/plain-napkin-oat/hero-1778153493327-Product_Shots42676_Web.jpg`,
    galleryUrls: [
      `${PRODUCT_MEDIA}/plain-napkin-oat/gallery-1-1778153496243-Product_Shots42698_Web.jpg`,
      `${PRODUCT_MEDIA}/plain-napkin-oat/gallery-2-1778153498914-1E9A2244_Sml.jpg`,
    ],
    hirePriceCents: 250,
    retailPriceCents: null,
    replacementCostCents: 3200,
    displayOrder: 40,
  },
  {
    id: "p_long_tablecloth_cream",
    slug: "long-tablecloth-cream",
    kind: "hire",
    status: "active",
    name: "Long tablecloth",
    category: "tablecloth",
    fabric: "Heavyweight stonewashed linen",
    colour: "Cream",
    size: "3.0 × 1.6 m",
    description:
      "Our flagship long tablecloth, sized for ten-to-twelve guests. Soft drape, generous overhang, hand-finished hem.",
    shortDescription: "Long-table cream linen — soft drape, hand-finished hem.",
    heroImageUrl: `${PRODUCT_MEDIA}/long-tablecloth-cream/hero-1778153504106-1E9A2351_Sml.jpg`,
    galleryUrls: [
      `${PRODUCT_MEDIA}/long-tablecloth-cream/gallery-1-1778153505359-1E9A2367_Sml.jpg`,
    ],
    hirePriceCents: 4500,
    retailPriceCents: null,
    replacementCostCents: 24000,
    displayOrder: 50,
  },
  {
    id: "p_long_tablecloth_sage",
    slug: "long-tablecloth-sage",
    kind: "hire",
    status: "active",
    name: "Long tablecloth",
    category: "tablecloth",
    fabric: "Heavyweight stonewashed linen",
    colour: "Sage",
    size: "3.0 × 1.6 m",
    description:
      "Sage-toned linen tablecloth with the same generous drape and finish as the cream. Disappears beautifully into a green-tone wedding palette.",
    shortDescription: "Long tablecloth in dusty sage.",
    heroImageUrl: `${PRODUCT_MEDIA}/long-tablecloth-sage/hero-1778153506702-1E9A2368_Sml.jpg`,
    galleryUrls: [],
    hirePriceCents: 4500,
    retailPriceCents: null,
    replacementCostCents: 24000,
    displayOrder: 60,
  },
  {
    id: "p_runner_olive",
    slug: "runner-olive",
    kind: "both",
    status: "active",
    name: "Table runner",
    category: "runner",
    fabric: "Soft linen, frayed edge",
    colour: "Olive",
    size: "3.5 × 0.5 m",
    description:
      "A long olive runner with frayed selvedge — laid down the centre of a long table, draped over a sweetheart, or used to soften an otherwise hard surface.",
    shortDescription: "Frayed-edge olive runner — long, soft, deeply useful.",
    heroImageUrl: null,
    galleryUrls: [],
    hirePriceCents: 1800,
    retailPriceCents: 9800,
    replacementCostCents: 16000,
    displayOrder: 70,
  },
  {
    id: "p_runner_clay",
    slug: "runner-clay",
    kind: "both",
    status: "active",
    name: "Table runner",
    category: "runner",
    fabric: "Soft linen, frayed edge",
    colour: "Clay",
    size: "3.5 × 0.5 m",
    description:
      "Clay-toned long runner — warm, lived-in, ages beautifully. Pairs with bone scallop napkins for an autumnal wedding palette.",
    shortDescription: "Long clay runner — warm and lived-in.",
    heroImageUrl: null,
    galleryUrls: [],
    hirePriceCents: 1800,
    retailPriceCents: 9800,
    replacementCostCents: 16000,
    displayOrder: 80,
  },
  {
    id: "p_napkin_set_giftbox",
    slug: "napkin-set-gift-box",
    kind: "retail",
    status: "active",
    name: "Set of six scallop napkins",
    category: "gift",
    fabric: "100% French linen, scallop edge",
    colour: "Mixed — bone, clay, olive",
    size: "50 × 50 cm",
    description:
      "A post-wedding gift set. Six hand-scalloped napkins in our three house colours, packed in a linen-wrapped box with care notes.",
    shortDescription: "Six house scallop napkins, linen-wrapped.",
    heroImageUrl: null,
    galleryUrls: [],
    hirePriceCents: null,
    retailPriceCents: 12800,
    replacementCostCents: null,
    displayOrder: 90,
  },
  {
    id: "p_candle_olive",
    slug: "olive-leaf-candle",
    kind: "retail",
    status: "active",
    name: "Olive-leaf candle",
    category: "merch",
    fabric: "Coconut & soy wax, recycled glass",
    colour: "Olive glass",
    size: "180g, 35hr burn",
    description:
      "Our house candle, made for the studio. A green, slightly herbal nose — olive leaf, salt, vetiver — with the kind of throw that fills a room without hijacking dinner.",
    shortDescription: "House candle. Olive leaf, salt, vetiver.",
    heroImageUrl: null,
    galleryUrls: [],
    hirePriceCents: null,
    retailPriceCents: 5800,
    replacementCostCents: null,
    displayOrder: 100,
  },
];
