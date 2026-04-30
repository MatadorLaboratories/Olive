import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Hide private surfaces from search engines.
        disallow: ["/account", "/trade", "/admin", "/api", "/hire/deposit", "/hire/account"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
