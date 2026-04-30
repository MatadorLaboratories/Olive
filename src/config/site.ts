/**
 * Site-wide brand & configuration constants.
 * Centralised so future buyers / admins can rebrand without code-spelunking.
 */

export const site = {
  name: "Olive Linen",
  tagline: "Like the olive to your martini",
  shortDescription:
    "Premium linen hire for weddings, events and hospitality in Queenstown, New Zealand.",
  longDescription:
    "Olive Linen is a premium linen hire studio based in Queenstown. We dress weddings, private events and hospitality venues with considered, beautifully laundered linen — scallop napkins, hand-finished tablecloths, runners and custom branded napkins for restaurants and brands.",
  location: "Queenstown, Aotearoa New Zealand",
  contactEmail: "hello@olivelinen.co.nz",
  phone: "+64 (0)3 000 0000",
  social: {
    instagram: "https://instagram.com/olivelinen",
    pinterest: "https://pinterest.com/olivelinen",
  },
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://olivelinen.co.nz",
} as const;

export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export const primaryNav: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Hire Linen", href: "/hire", description: "Book linen for your event" },
  { label: "Shop", href: "/shop", description: "Retail napkin sets, runners and gifts" },
  { label: "Portfolio", href: "/portfolio", description: "Real weddings & styled events" },
  { label: "Hospitality", href: "/hospitality", description: "Custom branded napkins" },
  { label: "About", href: "/about" },
] as const;

export const utilityNav: readonly NavItem[] = [
  { label: "Login", href: "/login" },
  { label: "Cart", href: "/cart" },
] as const;

export const footerNav = {
  Hire: [
    { label: "Book linen", href: "/hire" },
    { label: "How it works", href: "/hire/how-it-works" },
    { label: "Delivery & collection", href: "/about/delivery" },
    { label: "Pricing", href: "/about/pricing" },
  ],
  Explore: [
    { label: "Shop", href: "/shop" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Hospitality / Custom", href: "/hospitality" },
    { label: "Journal", href: "/journal" },
  ],
  Studio: [
    { label: "About Olive", href: "/about" },
    { label: "Contact", href: "/about/contact" },
    { label: "Trade applications", href: "/trade/apply" },
    { label: "FAQs", href: "/about/faqs" },
  ],
  Account: [
    { label: "Client login", href: "/login" },
    { label: "Trade login", href: "/login?role=vendor" },
    { label: "Terms", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
  ],
} as const;
