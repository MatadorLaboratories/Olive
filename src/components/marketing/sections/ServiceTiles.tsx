import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const services = [
  {
    title: "Hire linen",
    eyebrow: "01 / Events",
    subtitle: "For weddings, private events and the dinners that go on too long.",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
    href: "/hire" as const,
    cta: "Start a hire",
  },
  {
    title: "Shop linen",
    eyebrow: "02 / Retail",
    subtitle: "Take a piece of the studio home — sets of napkins, runners and post-wedding gifts.",
    image:
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=1000&q=80",
    href: "/shop" as const,
    cta: "Browse the shop",
  },
  {
    title: "Custom napkins",
    eyebrow: "03 / Hospitality",
    subtitle: "Branded linen for restaurants, bars and venues. Logo, edge, fabric, colour — all yours.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=80",
    href: "/hospitality" as const,
    cta: "Build a quote",
  },
];

export function ServiceTiles() {
  return (
    <section className="bg-canvas py-24 lg:py-36">
      <div className="shell-wide">
        <div className="max-w-3xl mb-16">
          <p className="eyebrow mb-4">Three ways in</p>
          <h2 className="font-display text-display-lg text-olive-900 leading-[1]">
            Pick a path.{" "}
            <span className="italic font-light text-olive-700/85">
              We'll meet you there.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <Link
              key={s.href}
              href={s.href}
              className="group relative block animate-fade-up"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="frame aspect-[4/5]">
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
                {/* Soft corner overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-olive-950/40 via-transparent to-transparent" />
                <div className="absolute top-5 left-5 right-5 flex items-center justify-between text-cream-50">
                  <p className="text-[11px] uppercase tracking-[0.18em] font-medium">
                    {s.eyebrow}
                  </p>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" strokeWidth={1.5} />
                </div>
                <div className="absolute bottom-6 left-6 right-6 text-cream-50">
                  <h3 className="font-display text-3xl leading-tight">{s.title}</h3>
                  <p className="mt-2 text-cream-50/85 text-sm leading-snug max-w-[28ch]">
                    {s.subtitle}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-[12px] uppercase tracking-[0.14em] text-olive-700">
                  {s.cta}
                </span>
                <span className="text-[12px] tabular text-olive-500">
                  0{i + 1} / 03
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
