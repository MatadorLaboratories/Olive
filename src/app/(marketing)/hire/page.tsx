import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Calendar, Layers, Truck, CreditCard, MessageCircle, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Hire linen — Book now",
  description:
    "Start your linen hire — pick dates, browse availability, secure with a 50% deposit.",
};

const steps = [
  {
    n: "01",
    icon: Calendar,
    title: "Pick your dates",
    body: "Tell us your event date, delivery and collection. We check live inventory.",
  },
  {
    n: "02",
    icon: Layers,
    title: "Choose your linen",
    body: "Browse only what's available for your dates — by category, colour, size, style.",
  },
  {
    n: "03",
    icon: Truck,
    title: "Delivery details",
    body: "Address, time windows, contacts, return arrangements.",
  },
  {
    n: "04",
    icon: CreditCard,
    title: "Pay 50% deposit",
    body: "Confirm with a deposit. Final balance is due 30 days before your event.",
  },
  {
    n: "05",
    icon: MessageCircle,
    title: "Stay in touch",
    body: "Message the studio, upload your timeline and edit details until 30 days out.",
  },
  {
    n: "06",
    icon: FileText,
    title: "All in one place",
    body: "Your booking, payments, documents and order history — in your client portal.",
  },
];

export default function HirePage() {
  return (
    <>
      <section className="bg-canvas pt-20 lg:pt-28 pb-20">
        <div className="shell-wide grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-6">Hire linen</p>
            <h1 className="font-display text-display-xl text-olive-900 leading-[0.96]">
              Six small steps.{" "}
              <span className="italic font-light">One soft table.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-olive-800/85 leading-relaxed">
              We've designed our booking to feel less like a checkout and more like
              talking to a planner you trust. Start with the date — we'll build the rest with you.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/hire/dates" className="btn">
                Start with dates
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
              <Link href="/portfolio" className="btn btn-secondary">
                See real weddings
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="frame aspect-[4/5]">
              <Image
                src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=80"
                alt="Linen-dressed wedding table"
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
        <div className="shell-wide">
          <div className="max-w-2xl mb-12">
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="font-display text-display-md text-olive-900 leading-[1]">
              From a date to a dressed table.
            </h2>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {steps.map((s) => (
              <li key={s.n} className="relative pt-6 border-t border-[color:var(--color-rule)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display text-3xl text-clay-500 italic">{s.n}</span>
                  <s.icon className="h-5 w-5 text-olive-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-2xl text-olive-900 leading-tight">{s.title}</h3>
                <p className="mt-3 text-olive-700/85 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-canvas py-20">
        <div className="shell-narrow text-center">
          <p className="eyebrow text-clay-500 mb-4">A note on the 30-day rule</p>
          <p className="font-display text-2xl md:text-3xl italic font-light text-olive-900 leading-snug">
            Up until 30 days out, you can edit anything in your booking — quantities,
            colours, delivery details. After that, stock and laundering are already
            committed; the studio approves changes by exception.
          </p>
        </div>
      </section>
    </>
  );
}
