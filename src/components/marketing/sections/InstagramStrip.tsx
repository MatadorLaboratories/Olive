import Link from "next/link";
import Image from "next/image";
import { Instagram, ArrowUpRight } from "lucide-react";
import { site } from "@/config/site";
import { getInstagramFeed } from "@/services/instagram";

const fallbackThumbs = [
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
];

export async function InstagramStrip() {
  const feed = await getInstagramFeed(6);
  const items =
    feed?.map((m) => ({
      key: m.id,
      src: m.mediaType === "VIDEO" ? m.thumbnailUrl ?? m.mediaUrl : m.mediaUrl,
      href: m.permalink,
      alt: (m.caption ?? "").slice(0, 120) || "Olive Linen on Instagram",
    })) ??
    fallbackThumbs.map((src, i) => ({
      key: String(i),
      src,
      href: site.social.instagram,
      alt: `Olive Linen Instagram post ${i + 1}`,
    }));

  return (
    <section className="bg-cream-100 py-20 lg:py-28 border-t border-[color:var(--color-rule-soft)]">
      <div className="shell-wide">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="eyebrow mb-3">Slow scroll</p>
            <h2 className="font-display text-display-md text-olive-900 leading-[1]">
              From the studio,{" "}
              <Link
                href={site.social.instagram}
                className="italic font-light underline decoration-clay-400 underline-offset-4 decoration-1 hover:decoration-clay-500"
              >
                @olivelinen
              </Link>
            </h2>
          </div>
          <Link
            href={site.social.instagram}
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 transition-colors"
          >
            <Instagram className="h-3.5 w-3.5" strokeWidth={1.5} />
            Follow on Instagram
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {items.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              target={feed ? "_blank" : undefined}
              rel={feed ? "noreferrer" : undefined}
              className="group block frame aspect-square"
              aria-label={it.alt}
            >
              <Image
                src={it.src}
                alt=""
                fill
                sizes="(min-width: 768px) 16vw, 33vw"
                className="object-cover"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
