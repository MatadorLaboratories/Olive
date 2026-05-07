import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, FileText } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { getCmsBlock } from "@/services/cms";

type SectionTile = {
  cmsKey: string;
  slug: string;
  title: string;
  description: string;
  liveAt: string;
  thumbnail: string | null;
};

/**
 * CMS index — a list of editable sections with live thumbnails and clear
 * "Edit" entry points. Replaces the old grid-of-textareas with a real
 * page-editor index.
 */
export default async function AdminCms() {
  const [hero, brand, about, faqs, hospitality, footerContact] = await Promise.all([
    getCmsBlock("home.hero"),
    getCmsBlock("home.brand_statement"),
    getCmsBlock("about.body"),
    getCmsBlock("faqs"),
    getCmsBlock("hospitality.options"),
    getCmsBlock("footer.contact"),
  ]);

  const tiles: SectionTile[] = [
    {
      cmsKey: "home.hero",
      slug: "home-hero",
      title: "Homepage hero",
      description:
        "Headline, supporting text, both CTAs, the italic tagline, and the hero photo.",
      liveAt: "/",
      thumbnail: hero?.images?.primary ?? null,
    },
    {
      cmsKey: "home.brand_statement",
      slug: "home-brand-statement",
      title: "Homepage · The studio block",
      description:
        "Headline lines, body, stats, pull quote, and the supporting image cluster.",
      liveAt: "/",
      thumbnail: brand?.images?.[0] ?? null,
    },
    {
      cmsKey: "about.body",
      slug: "about-body",
      title: "About page · Body",
      description:
        "Hero copy, promise quote, info blocks, and the cover photo for /about.",
      liveAt: "/about",
      thumbnail: about?.coverImage ?? null,
    },
    {
      cmsKey: "faqs",
      slug: "faqs",
      title: "About · Frequently asked questions",
      description: `${faqs?.length ?? 0} questions in the accordion list on /about.`,
      liveAt: "/about",
      thumbnail: null,
    },
    {
      cmsKey: "hospitality.options",
      slug: "hospitality-options",
      title: "Hospitality · Builder options",
      description:
        "Fabrics, edges, colour swatches, quantity-tier pricing, customer types — drives the design studio and auto-quote.",
      liveAt: "/hospitality/builder",
      thumbnail: null,
    },
    {
      cmsKey: "footer.contact",
      slug: "footer-contact",
      title: "Footer · Studio contact",
      description: `${footerContact?.location ?? "—"} · ${footerContact?.email ?? ""}`,
      liveAt: "/",
      thumbnail: null,
    },
  ];

  return (
    <div className="space-y-10 max-w-7xl">
      <PageHeader
        eyebrow="CMS · Public content"
        title={
          <>
            Edit the <span className="italic font-light">page.</span>
          </>
        }
        description="Pick a section to edit. Each one is a real page editor — fields, images, calls to action — not a JSON textarea. Changes go live within seconds of saving."
      />

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {tiles.map((t) => (
          <li key={t.cmsKey}>
            <Link
              href={`/admin/cms/${t.slug}`}
              className="card p-0 overflow-hidden group block hover:border-olive-300 transition-colors"
            >
              <div className="aspect-[16/9] relative bg-[color:var(--color-linen)] overflow-hidden">
                {t.thumbnail ? (
                  <Image
                    src={t.thumbnail}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-olive-500">
                    <FileText className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="eyebrow text-olive-500 mb-2 tabular">{t.cmsKey}</p>
                <p className="font-display text-2xl text-olive-900 leading-tight">
                  {t.title}
                </p>
                <p className="mt-3 text-sm text-olive-700/85 leading-relaxed">
                  {t.description}
                </p>
                <div className="mt-5 flex items-center justify-between text-[11px] uppercase tracking-[0.16em]">
                  <span className="text-olive-500">Edits {t.liveAt}</span>
                  <span className="text-olive-700 group-hover:text-clay-600 transition-colors inline-flex items-center gap-1">
                    Edit
                    <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
