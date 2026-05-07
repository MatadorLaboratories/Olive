import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // All marketing + product imagery is hosted in Supabase Storage
      // (`public-media` bucket). Unsplash was removed in May 2026 with
      // the real product photography pass — see
      // `docs/product-photography-mapping.md`.
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "cdn.olivelinen.co.nz" },
    ],
  },
  // typedRoutes will be re-enabled in Phase 2 once dynamic route segments
  // (/admin/bookings/[ref], /shop/[slug], …) are real and not synthesised
  // from inline arrays.
  typedRoutes: false,
};

export default nextConfig;
