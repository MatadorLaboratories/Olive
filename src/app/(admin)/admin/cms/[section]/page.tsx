import { notFound } from "next/navigation";
import { getCmsBlock } from "@/services/cms";
import { HomeHeroEditor } from "@/components/admin/cms/editors/HomeHeroEditor";
import { HomeBrandStatementEditor } from "@/components/admin/cms/editors/HomeBrandStatementEditor";
import { AboutBodyEditor } from "@/components/admin/cms/editors/AboutBodyEditor";
import { FaqsEditor } from "@/components/admin/cms/editors/FaqsEditor";
import { HospitalityOptionsEditor } from "@/components/admin/cms/editors/HospitalityOptionsEditor";
import { FooterContactEditor } from "@/components/admin/cms/editors/FooterContactEditor";

type Params = { section: string };

/**
 * Per-section CMS editor page. Each section slug maps to the matching
 * structured editor component. The shared SectionEditor shell handles
 * save / preview / back-nav consistently.
 */
export default async function AdminCmsSection({
  params,
}: {
  params: Promise<Params>;
}) {
  const { section } = await params;

  switch (section) {
    case "home-hero": {
      const data = await getCmsBlock("home.hero");
      return <HomeHeroEditor initial={data} />;
    }
    case "home-brand-statement": {
      const data = await getCmsBlock("home.brand_statement");
      return <HomeBrandStatementEditor initial={data} />;
    }
    case "about-body": {
      const data = await getCmsBlock("about.body");
      return <AboutBodyEditor initial={data} />;
    }
    case "faqs": {
      const data = await getCmsBlock("faqs");
      return <FaqsEditor initial={data} />;
    }
    case "hospitality-options": {
      const data = await getCmsBlock("hospitality.options");
      return <HospitalityOptionsEditor initial={data} />;
    }
    case "footer-contact": {
      const data = await getCmsBlock("footer.contact");
      return <FooterContactEditor initial={data} />;
    }
    default:
      notFound();
  }
}
