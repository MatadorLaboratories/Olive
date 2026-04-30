import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { getCmsBlock } from "@/services/cms";

/**
 * Editorial hero — split layout. Headline + collage.
 * Content read from `home.hero` CMS block; admin can edit.
 */
export async function Hero() {
  const block = await getCmsBlock("home.hero");
  const [line1 = "Linen, laid", line2 = "like a love letter", line3 = "to the table."] = block.headlineLines;

  return (
    <section className="relative overflow-hidden bg-canvas pt-12 lg:pt-20 pb-24 lg:pb-32">
      <div aria-hidden className="absolute inset-0 grain pointer-events-none" />

      <div className="shell-wide relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          <div className="lg:col-span-7 relative animate-fade-up">
            <p className="eyebrow flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-olive-700/40" />
              {block.eyebrow}
            </p>

            <h1 className="mt-6 font-display text-display-2xl text-olive-900">
              <span className="block">{line1}</span>
              <span className="block italic font-light">
                {/* Mid-line clay accent makes the headline sing — works across copy lengths */}
                {line2.includes("love letter") ? (
                  <>
                    like
                    <span className="inline-block px-3 -translate-y-2 align-middle">
                      <span className="tagline-script text-clay-500 text-[0.85em]">a love letter</span>
                    </span>
                  </>
                ) : (
                  line2
                )}
              </span>
              <span className="block">{line3}</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg text-olive-800/80 leading-relaxed">
              {block.supporting}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href={block.primaryCta.href} className="btn btn-clay">
                {block.primaryCta.label}
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
              <Link href={block.secondaryCta.href} className="btn btn-secondary">
                {block.secondaryCta.label}
              </Link>
            </div>

            <p className="mt-12 text-sm italic font-display text-olive-700/70">
              {block.tagline} —{" "}
              <Link href="/about" className="lnk">read the story</Link>.
            </p>
          </div>

          <div className="lg:col-span-5 relative animate-fade-up delay-200">
            <div className="relative aspect-[4/5] frame">
              <Image
                src={block.images.primary}
                alt="Linen-dressed table at a Queenstown wedding"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>

            <div className="hidden md:block absolute -left-10 -bottom-10 w-56 rotate-[-3deg] frame aspect-[3/4] shadow-lift">
              <Image
                src={block.images.collage}
                alt="Olive-toned scallop napkins folded for service"
                fill
                sizes="220px"
                className="object-cover"
              />
            </div>

            <div className="absolute -right-2 top-6 rotate-3 bg-cream-50 border border-[color:var(--color-rule)] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-olive-700">
              {block.images.tag}
            </div>
          </div>
        </div>

        <div className="mt-24 hidden lg:flex items-center gap-3 text-olive-700/60 animate-fade-in delay-500">
          <ArrowDown className="h-4 w-4 animate-bounce" strokeWidth={1.5} />
          <span className="text-[11px] uppercase tracking-[0.18em]">Scroll · the studio</span>
        </div>
      </div>
    </section>
  );
}
