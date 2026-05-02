import Link from "next/link";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { getCmsBlock } from "@/services/cms";
import { site } from "@/config/site";

/**
 * Editorial hero — split layout. Single confident image on the right,
 * confident type column on the left. No floating postcards, no rotated
 * tags, no chase-the-eye accents. The clay accent stays on one phrase.
 */
export async function Hero() {
  const block = await getCmsBlock("home.hero");
  const [line1 = "Linen, laid", line2 = "like a love letter", line3 = "to the table."] = block.headlineLines;
  // Defensive read for the new shape — caption may not exist on older fallbacks.
  const images = block.images as { primary: string; caption?: string };
  const caption = images.caption;

  return (
    <section className="relative bg-canvas pt-10 lg:pt-16 pb-20 lg:pb-28">
      <div className="shell-wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
          {/* Type column */}
          <div className="lg:col-span-7 relative" data-reveal>
            <p className="eyebrow flex items-center gap-3">
              <span className="inline-block h-px w-10 bg-olive-700/40" />
              {block.eyebrow}
            </p>

            <h1 className="mt-7 font-display text-display-2xl text-olive-900">
              <span className="block">{line1}</span>
              <span className="block italic font-light">
                {line2.includes("love letter") ? (
                  <>
                    like
                    <span className="inline-block px-3 -translate-y-1.5 align-middle">
                      <span className="tagline-script text-clay-500 text-[0.86em]">
                        a love letter
                      </span>
                    </span>
                  </>
                ) : (
                  line2
                )}
              </span>
              <span className="block">{line3}</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg text-olive-800/80 leading-[1.55]">
              {block.supporting}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href={block.primaryCta.href} className="btn btn-lg">
                {block.primaryCta.label}
              </Link>
              <Link href={block.secondaryCta.href} className="btn btn-secondary btn-lg">
                {block.secondaryCta.label}
              </Link>
            </div>

            <p className="mt-12 text-sm italic font-display text-olive-700/70">
              {block.tagline} —{" "}
              <Link href="/about" className="lnk">read the story</Link>.
            </p>
          </div>

          {/* Image column */}
          <div
            className="lg:col-span-5 relative"
            data-reveal
            data-reveal-delay="2"
          >
            <figure className="relative">
              <div className="frame relative aspect-[4/5]">
                <Image
                  src={images.primary}
                  alt="Linen dressed for a Queenstown wedding"
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 92vw"
                  className="object-cover"
                />
              </div>
              {caption && (
                <figcaption className="mt-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-olive-700/70">
                  <span className="inline-block h-px w-6 bg-olive-700/30" />
                  {caption}
                </figcaption>
              )}
            </figure>
          </div>
        </div>

        {/* Hairline + scroll cue */}
        <div className="mt-20 hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-3 text-olive-700/55">
            <ArrowDown className="h-4 w-4" strokeWidth={1.4} />
            <span className="text-[11px] uppercase tracking-[0.18em]">
              Scroll · the studio
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-[0.18em] text-olive-700/55">
            {site.location.split(",")[0]} · Aotearoa
          </span>
        </div>
      </div>
    </section>
  );
}
