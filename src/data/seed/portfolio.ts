import type { PortfolioItem } from "@/types/domain";

export const seedPortfolio: PortfolioItem[] = [
  {
    id: "po_charlotte_theo",
    slug: "charlotte-and-theo",
    title: "Charlotte & Theo",
    venue: "Glenorchy Estate",
    eventDate: "2024-03-23",
    coverUrl:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=1600&q=80",
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
    coverUrl:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
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
    coverUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
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
    coverUrl:
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=1600&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=1600&q=80",
    ],
    shortDescription:
      "Custom hospitality napkins for the Margot Group's Queenstown launch — branded in clay-stitched linen.",
    bodyMd:
      "Margot Group commissioned 240 custom napkins for the launch of their Queenstown restaurant — heavy linen, mitred edge, a small embroidered logo in our clay thread. The napkins now live as part of the venue's permanent service.",
    vendors: ["Margot Group", "Olive — Custom hospitality"],
    published: true,
  },
];
