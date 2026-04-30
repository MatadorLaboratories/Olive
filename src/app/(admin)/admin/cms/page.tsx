import { PageHeader } from "@/components/admin/PageHeader";
import { CmsEditor } from "@/components/admin/CmsEditor";
import { getCmsBlock } from "@/services/cms";

export default async function AdminCms() {
  const [hero, brand, about, faqs, hospitalityOptions, footerContact] = await Promise.all([
    getCmsBlock("home.hero"),
    getCmsBlock("home.brand_statement"),
    getCmsBlock("about.body"),
    getCmsBlock("faqs"),
    getCmsBlock("hospitality.options"),
    getCmsBlock("footer.contact"),
  ]);

  return (
    <div className="space-y-10 max-w-7xl">
      <PageHeader
        eyebrow="CMS · Public content"
        title={
          <>
            The brand, <span className="italic font-light">on a slider.</span>
          </>
        }
        description="Edit homepage blocks, About copy, FAQs, hospitality options and contact details. Changes go live within seconds of saving — no deploy required."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CmsEditor
          cmsKey="home.hero"
          initial={hero}
          label="Homepage · Hero"
          description="Eyebrow, multi-line headline, supporting line, both CTAs, tagline, hero imagery."
        />
        <CmsEditor
          cmsKey="home.brand_statement"
          initial={brand}
          label="Homepage · Brand statement"
          description="The Studio block — headline lines, body copy, KPI stats, pull quote, image cluster."
        />
        <CmsEditor
          cmsKey="about.body"
          initial={about}
          label="About · Body"
          description="About-page hero, promise quote, three info blocks, cover image."
        />
        <CmsEditor
          cmsKey="faqs"
          initial={faqs}
          label="About · FAQs"
          description="Accordion list — array of `{ q, a }`."
        />
        <CmsEditor
          cmsKey="hospitality.options"
          initial={hospitalityOptions}
          label="Hospitality · Builder options"
          description="Fabrics, edges, colour swatches, quantity tiers and pricing per piece for the napkin builder."
        />
        <CmsEditor
          cmsKey="footer.contact"
          initial={footerContact}
          label="Footer · Studio contact"
          description="Location, contact email and phone."
        />
      </div>
    </div>
  );
}
