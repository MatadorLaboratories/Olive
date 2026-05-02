/**
 * Custom-order auto-pricing.
 *
 * Pure function over the builder selections + the CMS-driven options block.
 * Generates a deterministic quote at submission time so the customer sees a
 * real number on the builder outcome screen instead of waiting for studio
 * follow-up. The studio admin can still override the total in
 * `/admin/wholesale/[reference]` for bespoke runs (oversized embroidery,
 * specialty edges, freight, etc.) — this just sets the seed.
 *
 * Pricing model:
 *
 *   subtotal_cents =
 *       qty * pieceUnitPriceCents(tier) * fabricMultiplier(fabric)
 *       OR
 *       priceFromCents(tier) * fabricMultiplier(fabric)        // gift sets
 *
 *   edge_upcharge_cents =
 *       round(subtotal * edgeUpchargeRate(edge))
 *
 *   total_cents = subtotal + edge_upcharge
 *
 *   * Tier rates live in CMS — per-piece (`ppuCents`) for runs, or
 *     `priceFromCents` for the gift-set bracket.
 *   * Fabric multipliers tilt the base for non-linen fabrics (cotton/poly
 *     are cheaper, linen is the reference).
 *   * Edge upcharges are %-based so the maths scales with order size.
 */

import type { BuilderOptions } from "@/components/hospitality/HospitalityBuilder";

export type ComputeQuoteInput = {
  fabric: string;
  edgeStyle: string;
  quantityTier: string;
  quantity: number | null;
};

export type QuoteLineItem = {
  label: string;
  amountCents: number;
  hint?: string;
};

export type ComputedQuote = {
  /** True when the inputs were enough to produce a numeric total. */
  ok: boolean;
  /** Total to charge, in NZ cents. */
  totalCents: number;
  /** Subtotal before edge upcharge. */
  subtotalCents: number;
  /** Edge-style upcharge in cents (0 for plain). */
  edgeUpchargeCents: number;
  /** Editorial breakdown the UI can render. */
  lineItems: QuoteLineItem[];
  /**
   * When true, this is a "from" quote — we couldn't pin an exact qty, but
   * the tier price gives a sensible commercial floor.
   */
  isIndicative: boolean;
  /**
   * Reason if `ok === false` — e.g. specialty edge that requires a studio
   * conversation rather than a self-serve quote.
   */
  unpriceableReason?: string;
};

// ---------- rate cards ----------

/**
 * Multiplier applied to the per-piece base by fabric. Linen is the reference
 * (×1.00). Cotton & cotton-rayon are slightly less. Polyester is cheaper
 * still — high-volume hospitality. Match the CMS `fabrics[].id`.
 */
const FABRIC_MULTIPLIER: Record<string, number> = {
  linen: 1.0,
  cotton: 0.85,
  cotton_rayon: 0.9,
  polyester: 0.7,
};

/**
 * Edge upcharges as a fraction of the subtotal. Plain mitred is the base
 * service. Trimmed adds a binding line. Hand-finished scallop adds the
 * studio's hallmark detail. Specialty (custom embroidery, contrast piping)
 * isn't self-priceable — the studio talks the customer through it.
 */
const EDGE_UPCHARGE: Record<string, number> = {
  plain: 0.0,
  trimmed: 0.1,
  scallop: 0.25,
  specialty: 0.35,
};

/** Edges that we don't auto-quote — needs studio time. */
const SPECIALTY_EDGES = new Set(["specialty"]);

// ---------- compute ----------

export function computeQuoteFromBuilder(
  input: ComputeQuoteInput,
  options: BuilderOptions,
): ComputedQuote {
  const fabric = options.fabrics.find((f) => f.id === input.fabric);
  const edge = options.edges.find((e) => e.id === input.edgeStyle);
  const tier = options.quantityTiers.find((t) => t.id === input.quantityTier);

  if (!fabric || !edge || !tier) {
    return blank("We need a fabric, edge and quantity tier to put a number on it.");
  }

  if (SPECIALTY_EDGES.has(edge.id)) {
    return blank(
      "Specialty edges are quoted by hand — we'll come back with a written number once we've seen the spec.",
    );
  }

  const fabricMult = FABRIC_MULTIPLIER[fabric.id] ?? 1.0;
  const edgeRate = EDGE_UPCHARGE[edge.id] ?? 0.0;

  // Per-piece tier: subtotal = qty * ppu * fabricMult.
  // Quantity tier without a qty entered → use the tier's lower bound by
  // multiplying the per-piece rate by 1 (single-piece floor) and flag
  // indicative; we still want to give them a number to grasp.
  let subtotalCents = 0;
  let isIndicative = false;
  const qty = input.quantity ?? 0;

  if (tier.ppuCents != null) {
    if (qty > 0) {
      subtotalCents = Math.round(tier.ppuCents * fabricMult * qty);
    } else {
      // No quantity entered — quote the lower bound of the tier so the
      // customer sees something commercially meaningful.
      const lowerBound = tierLowerBound(tier.id);
      subtotalCents = Math.round(tier.ppuCents * fabricMult * lowerBound);
      isIndicative = true;
    }
  } else if (tier.priceFromCents != null) {
    subtotalCents = Math.round(tier.priceFromCents * fabricMult);
    // Gift sets are "from" prices by design.
    isIndicative = true;
  } else {
    return blank("This tier needs a studio quote — we'll be in touch shortly.");
  }

  const edgeUpchargeCents = Math.round(subtotalCents * edgeRate);
  const totalCents = subtotalCents + edgeUpchargeCents;

  const lineItems: QuoteLineItem[] = [
    {
      label: tier.label,
      amountCents: subtotalCents,
      hint: lineHintFor(tier, fabric, qty),
    },
  ];
  if (edgeUpchargeCents > 0) {
    lineItems.push({
      label: `${edge.label} edge`,
      amountCents: edgeUpchargeCents,
      hint: `${Math.round(edgeRate * 100)}% finish upcharge`,
    });
  }

  return {
    ok: true,
    totalCents,
    subtotalCents,
    edgeUpchargeCents,
    lineItems,
    isIndicative,
  };
}

// ---------- helpers ----------

function blank(reason: string): ComputedQuote {
  return {
    ok: false,
    totalCents: 0,
    subtotalCents: 0,
    edgeUpchargeCents: 0,
    lineItems: [],
    isIndicative: false,
    unpriceableReason: reason,
  };
}

/**
 * Lower bound of each tier — used when the customer didn't enter a quantity
 * so we can still show a real price floor.
 */
function tierLowerBound(tierId: string): number {
  switch (tierId) {
    case "tier_40":
      return 40;
    case "tier_100":
      return 100;
    case "tier_500":
      return 500;
    case "tier_1000":
      return 1000;
    case "tier_5000":
      return 5000;
    default:
      return 1;
  }
}

function lineHintFor(
  tier: BuilderOptions["quantityTiers"][number],
  fabric: BuilderOptions["fabrics"][number],
  qty: number,
): string {
  if (tier.ppuCents != null) {
    const piecePartsNZD = (tier.ppuCents / 100).toFixed(2);
    if (qty > 0) {
      return `${qty} pcs · NZ$${piecePartsNZD} per piece in ${fabric.label.toLowerCase()}`;
    }
    return `From NZ$${piecePartsNZD} per piece in ${fabric.label.toLowerCase()}`;
  }
  return `Set price · ${fabric.label.toLowerCase()}`;
}
