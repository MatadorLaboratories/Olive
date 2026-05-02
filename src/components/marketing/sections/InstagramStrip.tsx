import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { site } from "@/config/site";
import { getInstagramFeed } from "@/services/instagram";

const fallbackThumbs = [
  "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1579389083395-4507e98b5e67?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80",
];

export async function InstagramStrip() {
  const feed = await getInstagramFeed(6);
  const items =
    feed?.map((m) => ({
      key: m.id,
      src: m.mediaType === "VIDEO" ? (m.thumbnailUrl ?? m.mediaUrl) : m.mediaUrl,
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
    <section className="bg-canvas py-24 lg:py-28 border-t border-[color:var(--border-hairline)]">
      <div className="shell-wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-end">
          <div className="lg:col-span-7" data-reveal>
            <p className="eyebrow flex items-center gap-3 mb-5">
              <span className="inline-block h-px w-10 bg-olive-700/40" />
              Slow scroll
            </p>
            <h2 className="font-display text-display-md text-olive-900 leading-[1.05]">
              From the studio,{" "}
              <Link
                href={site.social.instagram}
                className="italic font-light underline decoration-1 underline-offset-[6px] decoration-clay-400 hover:decoration-clay-500"
              >
                @olivelinen
              </Link>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:flex lg:justify-end" data-reveal data-reveal-delay="1">
            <Link
              href={site.social.instagram}
              className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
            >
              <Instagram className="h-3.5 w-3.5" strokeWidth={1.5} />
              Follow on Instagram
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {items.map((it, i) => (
            <Link
              key={it.key}
              href={it.href}
              target={feed ? "_blank" : undefined}
              rel={feed ? "noreferrer" : undefined}
              className="group block frame aspect-square"
              aria-label={it.alt}
              data-reveal
              data-reveal-delay={String(Math.min(i + 1, 4))}
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
