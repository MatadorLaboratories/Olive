import type { PortfolioItem } from "@/types/domain";

const SUPABASE_BRAND_BASE =
  "https://akaxacpjrqmtwwmnecav.supabase.co/storage/v1/object/public/public-media/brand";

const photo = {
  archBow:        `${SUPABASE_BRAND_BASE}/3d807f23-bc86-423b-b3b0-769a692df007.jpeg`,
  redRoses:       `${SUPABASE_BRAND_BASE}/5526beb0-a812-42f8-994d-b4cfcc2b35e6.jpeg`,
  greenDinner:    `${SUPABASE_BRAND_BASE}/fee6686f-979f-41ce-95d0-faa1ba29ec56.jpeg`,
  banquetAerial:  `${SUPABASE_BRAND_BASE}/8626c671-a16d-4c18-a48b-2436d3ab89f4.jpeg`,
  gardenMarquee:  `${SUPABASE_BRAND_BASE}/d0144340-85fe-4641-8cfb-7329e82d5ebf.jpeg`,
  yellowScallop:  `${SUPABASE_BRAND_BASE}/14e14fca-527c-4f98-9abd-7b3b30a2f48c.jpeg`,
  lakeNapkin:     `${SUPABASE_BRAND_BASE}/7768be5e-050e-4559-aa86-82ff65575b64.jpeg`,
  chandelierLong: `${SUPABASE_BRAND_BASE}/247b74ea-a9f0-4367-9304-b2f2ee7a93f8.jpeg`,
  whiteDahlias:   `${SUPABASE_BRAND_BASE}/8aec86d3-87e7-4db9-8af6-eea5e74f052e.jpeg`,
  lilacRound:     `${SUPABASE_BRAND_BASE}/145e224f-c717-40b5-aab4-6efcdc3e522f.jpeg`,
  pillarCandles:  `${SUPABASE_BRAND_BASE}/fc0b9e5a-3948-437a-9635-3b2df10a94a8.jpeg`,
};

export const seedPortfolio: PortfolioItem[] = [
  {
    id: "po_charlotte_theo",
    slug: "charlotte-and-theo",
    title: "Charlotte & Theo",
    venue: "Glenorchy Estate",
    eventDate: "2024-03-23",
    coverUrl: photo.archBow,
    galleryUrls: [
      photo.archBow,
      photo.gardenMarquee,
      photo.whiteDahlias,
      photo.banquetAerial,
    ],
    shortDescription:
      "A long-table autumn wedding at Glenorchy Estate, dressed in bone scallop napkins and a long olive runner.",
    bodyMd:
      "Charlotte and Theo wanted a wedding that felt like dinner with eighty of their favourite people. We dressed three long tables in cream linen, ran an olive table runner the length of each, and hand-folded ninety scallop napkins in bone. The candlelight did the rest.",
    vendors: [
      "Eames & Co. — Planning",
      "Studio Field — Photography",
      "Wakatipu Catering",
      "Glenorchy Estate",
    ],
    published: true,
  },
  {
    id: "po_vines_and_light",
    slug: "vines-and-light",
    title: "Vines & Light",
    venue: "Wanaka Wines",
    eventDate: "2024-12-14",
    coverUrl: photo.greenDinner,
    galleryUrls: [
      photo.greenDinner,
      photo.lilacRound,
      photo.gardenMarquee,
    ],
    shortDescription:
      "A high-summer wedding among the vines — clay scallop napkins, low ceramics, an unhurried lunch.",
    bodyMd:
      "We dressed sixty seats among the rows for a December wedding at Wanaka Wines. The brief was warm, low and unhurried. Clay scallops paired with a stonewashed cream cloth and a runner of olive — the warmest possible reading of a Central Otago summer.",
    vendors: ["Wanaka Wines", "Roper & Sons — Florals", "Sea Salt Catering"],
    published: true,
  },
  {
    id: "po_lake_dinner",
    slug: "lake-dinner",
    title: "Lake dinner",
    venue: "Private residence — Kelvin Heights",
    eventDate: "2024-10-05",
    coverUrl: photo.chandelierLong,
    galleryUrls: [
      photo.chandelierLong,
      photo.pillarCandles,
      photo.banquetAerial,
    ],
    shortDescription:
      "A private dinner for thirty-two on the deck of a Kelvin Heights home, dressed entirely in cream and clay.",
    bodyMd:
      "Three long tables on the deck, water in three directions. We served simple — a cream cloth, clay scallops, an olive runner — because the lake was already doing the work. The host's only request was that the linen feel lived-in, like it had been pulled from a drawer that morning.",
    vendors: ["Margot Group — Catering", "Studio Field — Photography"],
    published: true,
  },
  {
    id: "po_margot_launch",
    slug: "margot-queenstown-launch",
    title: "Margot Queenstown launch",
    venue: "Margot Group, Queenstown",
    eventDate: "2024-08-09",
    coverUrl: photo.redRoses,
    galleryUrls: [
      photo.redRoses,
      photo.yellowScallop,
      photo.lakeNapkin,
    ],
    shortDescription:
      "Custom hospitality napkins for the Margot Group's Queenstown launch — branded in clay-stitched linen.",
    bodyMd:
      "Margot Group commissioned 240 custom napkins for the launch of their Queenstown restaurant — heavy linen, mitred edge, a small embroidered logo in our clay thread. The napkins now live as part of the venue's permanent service.",
    vendors: ["Margot Group", "Olive — Custom hospitality"],
    published: true,
  },
];
