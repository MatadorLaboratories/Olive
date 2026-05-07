/**
 * Seed CMS blocks — keyed copy that admin can edit later in /admin/cms.
 * Pages call `getCmsBlock(key)` from the cms service; it returns the
 * Supabase row when the DB is connected, otherwise this seed.
 *
 * Brand image URLs point at `public-media/brand/...` in Supabase Storage —
 * uploaded once via the import pass, then referenced from both this seed
 * (demo / cold-start) and the live `cms_blocks` rows (production). Mirror
 * any changes made in the admin CMS back here so demo mode keeps parity.
 */

const BRAND =
  "https://akaxacpjrqmtwwmnecav.supabase.co/storage/v1/object/public/public-media/brand";

export type CmsBlock<T = unknown> = {
  key: string;
  data: T;
};

export const seedCms = {
  "home.hero": {
    eyebrow: "Premium linen hire — Queenstown, Aotearoa",
    headlineLines: ["Linen, laid", "like a love letter", "to the table."],
    supporting:
      "A small studio dressing weddings, private events and the kind of dinners that go on too long. Hand-pressed in Queenstown, delivered the length of the South Island.",
    primaryCta: { label: "Book linen", href: "/hire" },
    secondaryCta: { label: "See real weddings", href: "/portfolio" },
    tagline: "Like the olive to your martini",
    images: {
      primary: `${BRAND}/fc0b9e5a-3948-437a-9635-3b2df10a94a8.jpeg`,
      caption: "Pillar candles & linen drape — Wakatipu, March 2026",
    },
  },

  "home.brand_statement": {
    eyebrow: "The Studio",
    headlineLines: [
      "We don't dress tables.",
      "We undress them.",
      "Soft scallops. Slow folds.",
      "A martini in the right glass.",
    ],
    body:
      "Olive is a small, considered linen studio in the Wakatipu basin. We hire premium linen for weddings, private events and the kind of dinners that go on too long. Every napkin is washed in our studio, hand-pressed, and delivered ready to be loved.",
    stats: [
      { label: "Founded", value: "2022" },
      { label: "Events served", value: "300+" },
      { label: "Linen pieces", value: "12,000" },
      { label: "Trade partners", value: "40+" },
    ],
    pullQuote: {
      quote: "Soft, dusty, considered. The way Saturdays should feel.",
      attribution: "Vogue Living, Spring '24",
    },
    images: [
      `${BRAND}/145e224f-c717-40b5-aab4-6efcdc3e522f.jpeg`,
      `${BRAND}/8aec86d3-87e7-4db9-8af6-eea5e74f052e.jpeg`,
    ],
  },

  "about.body": {
    eyebrow: "The Studio",
    headlineLines: ["We make small details", "feel like big ones."],
    body:
      "Olive Linen began on a long table in Queenstown, with one set of scallop napkins and the suspicion that a wedding could feel a little softer. Three seasons later, the studio dresses some of New Zealand's most loved private events, restaurants and venues — quietly, beautifully, on time.",
    promiseQuote:
      "Every piece washed, pressed and folded by hand in our studio. Every booking answered by a person, not a portal. Every event treated like our own.",
    blocks: [
      { title: "Founded", body: "By a small team in the Wakatipu basin who couldn't find linen they loved enough." },
      { title: "Made for", body: "Weddings, private events, hospitality venues, brands who care about the table." },
      { title: "Where", body: "Queenstown, New Zealand — delivering through Central Otago and the South Island." },
    ],
    coverImage: `${BRAND}/247b74ea-a9f0-4367-9304-b2f2ee7a93f8.jpeg`,
  },

  "hospitality.options": {
    fabrics: [
      { id: "linen", label: "100% French linen" },
      { id: "cotton", label: "Cotton" },
      { id: "cotton_rayon", label: "Cotton-rayon blend" },
      { id: "polyester", label: "Polyester (high-volume hospitality)" },
    ],
    edges: [
      { id: "plain", label: "Plain mitred" },
      { id: "trimmed", label: "Trimmed edge" },
      { id: "scallop", label: "Hand-finished scallop" },
      { id: "specialty", label: "Specialty (consult studio)" },
    ],
    colours: [
      { id: "bone", label: "Bone", hex: "#EFE8D6" },
      { id: "cream", label: "Cream", hex: "#F4EFE6" },
      { id: "oat", label: "Oat", hex: "#E6DCC3" },
      { id: "olive", label: "Olive", hex: "#4F603A" },
      { id: "sage", label: "Sage", hex: "#97A57B" },
      { id: "clay", label: "Clay", hex: "#C8541C" },
      { id: "stone", label: "Stone", hex: "#8E8478" },
      { id: "ink", label: "Ink", hex: "#1D2616" },
    ],
    quantityTiers: [
      { id: "small_set", label: "Gift set (under 40)", priceFromCents: 1800, ppuCents: null },
      { id: "tier_40", label: "40 – 99", priceFromCents: null, ppuCents: 1450 },
      { id: "tier_100", label: "100 – 499", priceFromCents: null, ppuCents: 1180 },
      { id: "tier_500", label: "500 – 999", priceFromCents: null, ppuCents: 920 },
      { id: "tier_1000", label: "1,000 – 4,999", priceFromCents: null, ppuCents: 760 },
      { id: "tier_5000", label: "5,000+", priceFromCents: null, ppuCents: 580 },
    ],
    customerTypes: [
      { id: "restaurant", label: "Restaurant" },
      { id: "bar", label: "Bar" },
      { id: "hotel", label: "Hotel" },
      { id: "venue", label: "Wedding or event venue" },
      { id: "planner", label: "Planner / stylist" },
      { id: "wedding_client", label: "Wedding client" },
      { id: "corporate", label: "Corporate / brand" },
      { id: "post_wedding_gift", label: "Post-wedding gift" },
    ],
  },

  "footer.contact": {
    location: "Queenstown, Aotearoa New Zealand",
    email: "hello@olivelinen.co.nz",
    phone: "+64 (0)3 000 0000",
  },

  "faqs": [
    {
      q: "How far in advance should I book?",
      a: "For peak wedding season (December – April), we'd suggest at least nine months ahead. For private dinners and hospitality launches, six to eight weeks is plenty.",
    },
    {
      q: "Where do you deliver?",
      a: "Queenstown, Wanaka, Arrowtown and Central Otago as standard. We can deliver further afield across the South Island — and we have done — there's just a travel charge.",
    },
    {
      q: "What if something is damaged or lost?",
      a: "We expect normal wear. Items lost or damaged beyond repair are charged at replacement value, which is documented on every quote and invoice.",
    },
    {
      q: "Can we change our quantities after booking?",
      a: "Yes — until 30 days before your event. After that the studio approves changes by exception, because stock and laundering are already locked in.",
    },
    {
      q: "Do you offer trade pricing?",
      a: "Yes. Wedding planners, stylists and venues with a trade history with us are eligible for trade-tier discounts. Apply via the trade portal.",
    },
  ],
} as const;

export type SeedCmsKey = keyof typeof seedCms;
