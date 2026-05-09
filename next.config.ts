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
  experimental: {
    // Product image uploads run through Server Actions with a documented
    // 12 MB cap (see services/admin/product-images.ts). The Next.js default
    // body size for Server Actions is 1 MB, so any real-world photo would
    // 500 the action and surface the generic "page couldn't load" error.
    // 15 MB gives headroom for the multipart envelope on a 12 MB file.
    serverActions: { bodySizeLimit: "15mb" },
  },
};

export default nextConfig;
