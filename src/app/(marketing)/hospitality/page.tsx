import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Hospitality & Custom",
  description:
    "Custom branded napkins for restaurants, bars, venues and brands. Logo, fabric, edge and colour — all yours.",
};

export default function HospitalityPage() {
  return (
    <>
      <section className="bg-canvas pt-20 lg:pt-28 pb-20">
        <div className="shell-wide grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <p className="eyebrow flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-olive-700/40" />
              Hospitality · Custom napkins
            </p>
            <h1 className="mt-6 font-display text-display-xl text-olive-900 leading-[0.96]">
              Make your brand feel{" "}
              <span className="italic font-light">like itself</span> on the table.
            </h1>
            <p className="mt-8 text-lg text-olive-800/80 max-w-xl leading-relaxed">
              Branded linen for restaurants, bars, hotels and wedding clients.
              Choose your fabric, edge, colour and logo — we produce in tiers from
              40 to 5,000 pieces, with deposit, full payment, or quote-only options.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/hospitality/builder" className="btn btn-clay">
                Start the builder
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
              <Link href="/hospitality/quote" className="btn btn-secondary">
                Request a quote
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="frame aspect-[4/5]">
              <Image
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=80"
                alt="Custom branded napkins for hospitality clients"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream-50 py-20 border-t border-[color:var(--color-rule-soft)]">
        <div className="shell-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Pick fabric & edge",
                body: "Linen, cotton, cotton-rayon or polyester. Plain, trimmed, scallop or specialty edge — admin-defined options to match your brand.",
              },
              {
                step: "02",
                title: "Add your mark",
                body: "Upload logos, brand colours, inspiration boards. Choose Pantone-matched thread or printed treatments.",
              },
              {
                step: "03",
                title: "Quote or pay",
                body: "Tier pricing from gift sets to 5,000+. Pay a deposit, pay in full, or get a quote — whichever the studio configures for your tier.",
              },
            ].map((s) => (
              <div key={s.step} className="border-t border-[color:var(--color-rule)] pt-6">
                <p className="eyebrow text-clay-500">Step {s.step}</p>
                <h3 className="mt-3 font-display text-2xl text-olive-900">{s.title}</h3>
                <p className="mt-3 text-olive-700/80 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
