import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getProducts } from "@/services/catalogue";
import { getPortfolioItems } from "@/services/portfolio";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, "");

  const staticUrls: MetadataRoute.Sitemap = [
    "",
    "/hire",
    "/shop",
    "/portfolio",
    "/hospitality",
    "/hospitality/builder",
    "/about",
    "/about/contact",
    "/login",
    "/signup",
    "/trade/apply",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  const products = await getProducts();
  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/shop/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const portfolio = await getPortfolioItems();
  const portfolioUrls: MetadataRoute.Sitemap = portfolio.map((it) => ({
    url: `${base}/portfolio/${it.slug}`,
    lastModified: it.eventDate ? new Date(it.eventDate) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticUrls, ...productUrls, ...portfolioUrls];
}
