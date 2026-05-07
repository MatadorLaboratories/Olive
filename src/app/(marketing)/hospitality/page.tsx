import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Hospitality & Custom",
  description:
    "Custom branded napkins for restaurants, bars, venues and brands. Logo, fabric, edge and colour — all yours.",
};

const steps = [
  {
    step: "01",
    title: "Fabric & edge",
    body: "Linen, cotton, cotton-rayon or polyester. Plain, trimmed, scallop or specialty edge — chosen with your brand and service in mind.",
  },
  {
    step: "02",
    title: "Your mark",
    body: "Upload logos, brand colours, inspiration. Pantone-matched embroidery thread or printed treatments. Hand-finished by us.",
  },
  {
    step: "03",
    title: "Quote or pay",
    body: "Tier pricing from gift sets to 5,000+. Pay a deposit, pay in full, or get a written quote — whichever fits your timeline.",
  },
];

export default function HospitalityPage() {
  return (
    <>
      {/* Hero — editorial split */}
      <section className="bg-canvas pt-12 lg:pt-20 pb-20 lg:pb-28">
        <div className="shell-wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
            <div className="lg:col-span-7" data-reveal>
              <p className="eyebrow flex items-center gap-3 mb-5">
                <span className="inline-block h-px w-10 bg-olive-700/40" />
                Hospitality · Custom napkins
              </p>
              <h1 className="font-display text-display-2xl text-olive-900 leading-[0.96]">
                Make your brand feel{" "}
                <span className="italic font-light">like itself</span>{" "}
                on the table.
              </h1>
              <p className="mt-8 text-lg text-olive-800/80 max-w-xl leading-[1.55]">
                Branded linen for restaurants, bars, hotels and venues. Choose
                your fabric, edge, colour and logo — we produce in tiers from
                forty to five thousand pieces, with deposit, full payment, or
                quote-only options.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link href="/hospitality/builder" className="btn btn-lg">
                  Start the builder
                </Link>
                <Link
                  href="/about/contact"
                  className="btn btn-secondary btn-lg"
                >
                  Talk to the studio
                </Link>
              </div>
              <p className="mt-12 text-sm italic font-display text-olive-700/70">
                Hand-finished in Queenstown, three weeks from approval to ship.
              </p>
            </div>

            <div className="lg:col-span-5" data-reveal data-reveal-delay="2">
              <figure className="relative">
                <div className="frame relative aspect-[4/5]">
                  <Image
                    src="https://akaxacpjrqmtwwmnecav.supabase.co/storage/v1/object/public/public-media/brand/7768be5e-050e-4559-aa86-82ff65575b64.jpeg"
                    alt="Custom scallop napkin held above the lake — Wakatipu, summer 2026"
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, 92vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <figcaption className="mt-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-olive-700/70">
                  <span className="inline-block h-px w-6 bg-olive-700/30" />
                  Custom scallop in clay · Lake Wakatipu
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[color:var(--color-paper)] py-24 lg:py-32 border-y border-[color:var(--border-hairline)]">
        <div className="shell-wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-14 items-end">
            <div className="lg:col-span-7" data-reveal>
              <p className="eyebrow flex items-center gap-3 mb-5">
                <span className="inline-block h-px w-10 bg-olive-700/40" />
                How it goes
              </p>
              <h2 className="font-display text-display-lg text-olive-900 leading-[1.02]">
                Three small decisions,{" "}
                <span className="italic font-light text-olive-700/85">
                  a quietly serious result.
                </span>
              </h2>
            </div>
            <div className="lg:col-span-5" data-reveal data-reveal-delay="1">
              <p className="text-olive-800/80 leading-relaxed max-w-md">
                Most hospitality clients run the builder once, then we
                correspond about the small things — thread tone, pantone match,
                fold preferences — over a few emails.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
            {steps.map((s, i) => (
              <article
                key={s.step}
                className="border-t border-[color:var(--border-base)] pt-6"
                data-reveal
                data-reveal-delay={String(Math.min(i + 1, 4))}
              >
                <p className="font-display italic tabular text-clay-500 text-lg leading-none">
                  {s.step}
                </p>
                <h3 className="mt-4 font-display text-[clamp(1.5rem,1.8vw,1.875rem)] text-olive-900 leading-[1.05]">
                  {s.title}
                </h3>
                <p className="mt-4 text-olive-700/85 leading-relaxed text-[15px]">
                  {s.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center gap-3">
            <Link href="/hospitality/builder" className="btn btn-lg">
              Start the builder
            </Link>
            <Link href="/about/contact" className="btn btn-secondary btn-lg">
              Talk first
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
