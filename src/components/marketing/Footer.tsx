import Link from "next/link";
import { Instagram } from "lucide-react";
import { footerNav, site } from "@/config/site";
import { Wordmark } from "@/components/brand/Wordmark";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-olive-950 text-cream-100">
      {/* Soft warm wash at the top edge */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-clay-500/40 to-transparent"
      />

      <div className="shell-wide pt-24 pb-12 lg:pt-32">
        {/* Brand row — large editorial signature */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-10">
          <div className="lg:col-span-5 xl:col-span-6">
            <Link href="/" aria-label="Olive Linen home" className="text-cream-100 inline-block">
              <Wordmark className="h-9 w-auto" />
            </Link>
            <p className="font-display italic text-cream-100/80 mt-10 text-3xl md:text-4xl leading-[1.1] max-w-xl">
              {site.tagline}<span className="text-clay-300">.</span>
            </p>
            <p className="mt-8 max-w-md text-cream-100/65 leading-relaxed">
              {site.longDescription}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/hire" className="btn btn-clay">
                Start a hire
              </Link>
              <Link href="/about/contact" className="btn btn-secondary !text-cream-100 !border-cream-100/40 hover:!bg-cream-100 hover:!text-olive-900">
                Talk to the studio
              </Link>
            </div>
          </div>

          {/* Sitemap columns */}
          <div className="lg:col-span-7 xl:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
            {Object.entries(footerNav).map(([heading, items]) => (
              <div key={heading}>
                <p className="eyebrow text-clay-300/80 mb-5">{heading}</p>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-[15px] text-cream-100/85 hover:text-clay-300 transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Studio block + newsletter */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-12 gap-10 pb-10 border-b border-cream-100/10">
          <div className="lg:col-span-5">
            <p className="eyebrow text-clay-300/80 mb-4">Studio</p>
            <p className="text-cream-100/85 leading-relaxed">
              {site.location}
              <br />
              <a href={`mailto:${site.contactEmail}`} className="hover:text-clay-300 transition-colors">
                {site.contactEmail}
              </a>
              <br />
              <span className="tabular-nums text-cream-100/65">{site.phone}</span>
            </p>
          </div>

          <div className="lg:col-span-7">
            <p className="eyebrow text-clay-300/80 mb-4">Letters from the studio</p>
            <p className="text-cream-100/80 mb-6 max-w-lg">
              Quiet news from Queenstown — new linens, real weddings and the occasional martini recipe. No clutter.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom utility row */}
        <div className="mt-10 flex flex-col md:flex-row gap-6 md:items-center justify-between text-[12px] uppercase tracking-[0.14em] text-cream-100/50">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href={site.social.instagram} className="inline-flex items-center gap-2 hover:text-clay-300 transition-colors">
              <Instagram className="h-3.5 w-3.5" strokeWidth={1.5} />
              Instagram
            </Link>
            <Link href="/legal/terms" className="hover:text-clay-300 transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-clay-300 transition-colors">Privacy</Link>
            <span className="text-cream-100/30">Crafted in Aotearoa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
