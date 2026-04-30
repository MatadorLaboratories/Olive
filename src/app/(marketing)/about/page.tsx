import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { getCmsBlock } from "@/services/cms";

export const metadata: Metadata = {
  title: "About",
  description:
    "Olive Linen — a small, considered linen studio in the Wakatipu basin, Queenstown.",
};

export default async function AboutPage() {
  const about = await getCmsBlock("about.body");
  const faqs = await getCmsBlock("faqs");

  return (
    <>
      <section className="bg-canvas pt-20 lg:pt-28 pb-24">
        <div className="shell-wide grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-6">{about.eyebrow}</p>
            <h1 className="font-display text-display-xl text-olive-900 leading-[0.96]">
              {about.headlineLines.map((line, i) => (
                <span key={i} className={i === 1 ? "block italic font-light text-olive-700/85" : "block"}>
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-10 text-lg text-olive-800/85 max-w-2xl leading-relaxed">
              {about.body}
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="frame aspect-[4/5]">
              <Image
                src={about.coverImage}
                alt="Wakatipu basin"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream-50 py-24 border-y border-[color:var(--color-rule-soft)]">
        <div className="shell-narrow text-center">
          <p className="eyebrow text-clay-500 mb-6">Promise</p>
          <p className="font-display text-display-md italic font-light text-olive-900 leading-[1.1]">
            "{about.promiseQuote}"
          </p>
        </div>
      </section>

      <section className="bg-canvas py-24">
        <div className="shell-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {about.blocks.map((b) => (
              <div key={b.title} className="border-t border-[color:var(--color-rule)] pt-6">
                <p className="eyebrow text-olive-600 mb-3">{b.title}</p>
                <p className="text-olive-800/85 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-cream-50 py-24 border-t border-[color:var(--color-rule-soft)]">
        <div className="shell-narrow">
          <p className="eyebrow mb-4">Quietly asked</p>
          <h2 className="font-display text-display-lg text-olive-900 leading-[1] mb-12">
            The <span className="italic font-light">questions</span> we hear most.
          </h2>

          <ul className="divide-y divide-[color:var(--color-rule-soft)] border-y border-[color:var(--color-rule-soft)]">
            {faqs.map((f, i) => (
              <li key={i}>
                <details className="group py-7">
                  <summary className="flex items-baseline justify-between gap-4 cursor-pointer list-none">
                    <span className="font-display text-2xl text-olive-900">{f.q}</span>
                    <ChevronDown className="h-4 w-4 text-olive-600 transition-transform group-open:rotate-180" strokeWidth={1.5} />
                  </summary>
                  <p className="mt-4 text-olive-800/85 leading-relaxed max-w-3xl">{f.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-canvas py-20">
        <div className="shell-narrow text-center">
          <Link href="/about/contact" className="btn btn-clay">Get in touch</Link>
        </div>
      </section>
    </>
  );
}
