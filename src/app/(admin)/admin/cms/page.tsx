import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { getCmsBlock } from "@/services/cms";

type SectionTile = {
  cmsKey: string;
  slug: string;
  title: string;
  description: string;
  liveAt: string;
  thumbnail: string | null;
  /** Optional rich preview rendered when there is no thumbnail image. */
  preview?: React.ReactNode;
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
      preview: <FaqsPreview faqs={faqs as unknown as Array<{ q: string; a: string }> | null} />,
    },
    {
      cmsKey: "hospitality.options",
      slug: "hospitality-options",
      title: "Hospitality · Builder options",
      description:
        "Fabrics, edges, colour swatches, quantity-tier pricing, customer types — drives the design studio and auto-quote.",
      liveAt: "/hospitality/builder",
      thumbnail: null,
      preview: (
        <HospitalityOptionsPreview
          options={
            hospitality as unknown as {
              fabrics?: Array<{ label: string }>;
              edges?: Array<{ label: string }>;
              colours?: Array<{ label: string; hex: string }>;
              quantityTiers?: Array<unknown>;
              customerTypes?: Array<unknown>;
            } | null
          }
        />
      ),
    },
    {
      cmsKey: "footer.contact",
      slug: "footer-contact",
      title: "Footer · Studio contact",
      description: `${footerContact?.location ?? "—"} · ${footerContact?.email ?? ""}`,
      liveAt: "/",
      thumbnail: null,
      preview: (
        <FooterContactPreview
          contact={
            footerContact as {
              location?: string;
              email?: string;
              phone?: string;
            } | null
          }
        />
      ),
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
                  <div className="absolute inset-0 p-5 overflow-hidden">
                    {t.preview}
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

/* -------------------------------------------------------------------------- */
/*  Block-specific previews                                                   */
/*  Rendered inside the 16:9 thumbnail area when a block has no hero image.   */
/*  Each one surfaces a few real values so editors can see what's there at a  */
/*  glance — replaces the old dead document icon.                             */
/* -------------------------------------------------------------------------- */

function FaqsPreview({ faqs }: { faqs: Array<{ q: string; a: string }> | null }) {
  const items = (faqs ?? []).slice(0, 3);
  if (items.length === 0) {
    return (
      <p className="text-xs text-olive-500/70 italic">No FAQs yet — add the first.</p>
    );
  }
  return (
    <ul className="space-y-2.5 text-olive-700">
      {items.map((f, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] leading-snug">
          <span className="tabular text-olive-500/70 shrink-0">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="line-clamp-1 text-olive-800">{f.q}</span>
        </li>
      ))}
      {(faqs?.length ?? 0) > 3 && (
        <li className="text-[11px] uppercase tracking-[0.16em] text-olive-500/70 pt-0.5">
          +{(faqs?.length ?? 0) - 3} more
        </li>
      )}
    </ul>
  );
}

function HospitalityOptionsPreview({
  options,
}: {
  options: {
    fabrics?: Array<{ label: string }>;
    edges?: Array<{ label: string }>;
    colours?: Array<{ label: string; hex: string }>;
    quantityTiers?: Array<unknown>;
    customerTypes?: Array<unknown>;
  } | null;
}) {
  const fabrics = options?.fabrics?.length ?? 0;
  const edges = options?.edges?.length ?? 0;
  const tiers = options?.quantityTiers?.length ?? 0;
  const customers = options?.customerTypes?.length ?? 0;
  const swatches = (options?.colours ?? []).slice(0, 8);

  return (
    <div className="h-full flex flex-col justify-between text-olive-800">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
        <div className="flex items-baseline justify-between">
          <span className="text-olive-500/80">Fabrics</span>
          <span className="tabular font-medium">{fabrics}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-olive-500/80">Edges</span>
          <span className="tabular font-medium">{edges}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-olive-500/80">Tiers</span>
          <span className="tabular font-medium">{tiers}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-olive-500/80">Customers</span>
          <span className="tabular font-medium">{customers}</span>
        </div>
      </div>
      {swatches.length > 0 && (
        <div>
          <p className="eyebrow text-olive-500/80 mb-1.5">
            Colours · {options?.colours?.length ?? 0}
          </p>
          <div className="flex gap-1.5">
            {swatches.map((c) => (
              <span
                key={c.label}
                title={c.label}
                className="h-5 w-5 rounded-full border border-olive-900/10"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FooterContactPreview({
  contact,
}: {
  contact: { location?: string; email?: string; phone?: string } | null;
}) {
  if (!contact) {
    return (
      <p className="text-xs text-olive-500/70 italic">No contact details set.</p>
    );
  }
  return (
    <dl className="space-y-2 text-[13px] text-olive-800">
      {contact.location && (
        <div>
          <dt className="eyebrow text-olive-500/80 mb-0.5">Studio</dt>
          <dd className="leading-snug">{contact.location}</dd>
        </div>
      )}
      {contact.email && (
        <div>
          <dt className="eyebrow text-olive-500/80 mb-0.5">Email</dt>
          <dd className="leading-snug truncate">{contact.email}</dd>
        </div>
      )}
      {contact.phone && (
        <div>
          <dt className="eyebrow text-olive-500/80 mb-0.5">Phone</dt>
          <dd className="leading-snug tabular">{contact.phone}</dd>
        </div>
      )}
    </dl>
  );
}
