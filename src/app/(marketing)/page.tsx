import { Hero } from "@/components/marketing/sections/Hero";
import { BrandStatement } from "@/components/marketing/sections/BrandStatement";
import { FeaturedProducts } from "@/components/marketing/sections/FeaturedProducts";
import { PortfolioPreview } from "@/components/marketing/sections/PortfolioPreview";
import { ServiceTiles } from "@/components/marketing/sections/ServiceTiles";
import { Testimonials } from "@/components/marketing/sections/Testimonials";
import { InstagramStrip } from "@/components/marketing/sections/InstagramStrip";
import { MartiniBand } from "@/components/marketing/sections/MartiniBand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BrandStatement />
      <FeaturedProducts />
      <PortfolioPreview />
      <ServiceTiles />
      <Testimonials />
      <InstagramStrip />
      <MartiniBand />
    </>
  );
}
