import Link from "next/link";
import Image from "next/image";

/**
 * Three pathways — events / retail / hospitality. Type-led tiles with
 * one strong image each. Lighter on garnish than the previous version.
 */
const services = [
  {
    label: "Events",
    title: "Hire linen",
    body: "For weddings, private events and the dinners that go on too long. Pick dates first, then we'll show you what's available.",
    image:
      "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1100&q=85",
    href: "/hire" as const,
    cta: "Start a hire",
  },
  {
    label: "Retail",
    title: "Shop linen",
    body: "Take a piece of the studio home. Sets of scallop napkins, runners, candles and post-wedding gifts.",
    image:
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=1100&q=85",
    href: "/shop" as const,
    cta: "Browse the shop",
  },
  {
    label: "Hospitality",
    title: "Custom napkins",
    body: "Branded linen for restaurants, bars, venues and brands. Logo, edge, fabric, colour — tiers from forty to five thousand.",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1100&q=85",
    href: "/hospitality" as const,
    cta: "Build a quote",
  },
];

export function ServiceTiles() {
  return (
    <section className="bg-canvas py-24 lg:py-36 border-t border-[color:var(--border-hairline)]">
      <div className="shell-wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 items-end">
          <div className="lg:col-span-7" data-reveal>
            <p className="eyebrow flex items-center gap-3 mb-5">
              <span className="inline-block h-px w-10 bg-olive-700/40" />
              Three ways in
            </p>
            <h2 className="font-display text-display-lg text-olive-900 leading-[1.02]">
              Pick a path.{" "}
              <span className="italic font-light text-olive-700/85">
                We'll meet you there.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-5" data-reveal data-reveal-delay="1">
            <p className="text-olive-800/80 leading-relaxed max-w-md">
              Three pathways into the studio — pick one, or use the front door.
              Either way, you'll be talking to a person within a day.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {services.map((s, i) => (
            <article
              key={s.href}
              className="group flex flex-col"
              data-reveal
              data-reveal-delay={String(Math.min(i + 1, 4))}
            >
              <Link href={s.href} className="block">
                <div className="frame aspect-[4/5] relative">
                  <Image
                    src={s.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                  {/* Quiet label, top-left, on a hairline panel */}
                  <span className="absolute top-4 left-4 inline-flex items-center px-2.5 py-1 rounded-full bg-cream-50/85 backdrop-blur-sm border border-[color:var(--border-soft)] text-[10px] uppercase tracking-[0.16em] text-olive-700">
                    {s.label}
                  </span>
                </div>
              </Link>

              <div className="mt-6 flex flex-col flex-1">
                <h3 className="font-display text-[clamp(1.75rem,2.4vw,2.25rem)] text-olive-900 leading-[1.05]">
                  {s.title}
                </h3>
                <p className="mt-3 text-olive-700/85 leading-relaxed text-[15px] max-w-sm">
                  {s.body}
                </p>
                <div className="mt-6 pt-5 border-t border-[color:var(--border-hairline)]">
                  <Link
                    href={s.href}
                    className="inline-flex items-baseline gap-3 text-[12px] uppercase tracking-[0.16em] text-olive-800 hover:text-clay-600 transition-colors"
                  >
                    <span className="inline-block w-6 h-px bg-current" />
                    {s.cta}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
