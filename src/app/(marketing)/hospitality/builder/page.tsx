import type { Metadata } from "next";
import { HospitalityBuilder } from "@/components/hospitality/HospitalityBuilder";
import { PageHero } from "@/components/marketing/PageHero";
import { getCmsBlock } from "@/services/cms";

export const metadata: Metadata = {
  title: "Custom napkin builder",
  description:
    "Design custom branded napkins for your restaurant, bar, venue or wedding — fabric, edge, colour, quantity tier.",
};

export default async function HospitalityBuilderPage() {
  const options = await getCmsBlock("hospitality.options");

  return (
    <>
      <PageHero
        eyebrow="Hospitality · Custom napkins"
        title={
          <>
            Build a <span className="italic font-light">napkin</span> in five small steps.
          </>
        }
        body={
          <>
            Pick your fabric, your edge, your colour, your tier — and tell us a little about
            your brand. We'll come back with a written quote within one business day.
          </>
        }
      />

      <HospitalityBuilder
        options={{
          fabrics: [...options.fabrics],
          edges: [...options.edges],
          colours: [...options.colours],
          quantityTiers: [...options.quantityTiers],
          customerTypes: [...options.customerTypes],
        }}
      />
    </>
  );
}
