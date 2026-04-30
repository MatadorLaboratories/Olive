import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
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
