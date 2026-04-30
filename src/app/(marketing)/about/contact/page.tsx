import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { EnquiryForm } from "@/components/marketing/EnquiryForm";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Olive Linen studio in Queenstown.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Talk to the <span className="italic font-light">studio.</span>
          </>
        }
        body={
          <>
            Tell us about your event, your venue, the feeling you're after.
            We read every enquiry — and reply within one business day.
          </>
        }
      />

      <section className="bg-canvas pb-32">
        <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7">
            <EnquiryForm source="contact" />
          </div>

          <aside className="lg:col-span-5">
            <div className="card p-7">
              <p className="eyebrow text-clay-500 mb-4">The studio</p>

              <ul className="space-y-5">
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-olive-500 mt-1 shrink-0" strokeWidth={1.5} />
                  <span className="text-olive-800 leading-relaxed">{site.location}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-olive-500 mt-1 shrink-0" strokeWidth={1.5} />
                  <a href={`mailto:${site.contactEmail}`} className="lnk text-olive-800">
                    {site.contactEmail}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-olive-500 mt-1 shrink-0" strokeWidth={1.5} />
                  <span className="text-olive-800 tabular">{site.phone}</span>
                </li>
              </ul>

              <hr className="my-7" />

              <p className="eyebrow text-olive-600 mb-3">Studio hours</p>
              <p className="text-olive-800 text-sm leading-relaxed">
                Monday – Friday, 9am – 5pm NZST.
                <br />
                Weekend events are dressed by appointment.
              </p>

              <hr className="my-7" />

              <p className="eyebrow text-olive-600 mb-3">Trade enquiries</p>
              <p className="text-olive-700/85 text-sm leading-relaxed">
                Planners, stylists, venues — apply via{" "}
                <a href="/trade/apply" className="lnk">our trade portal</a>{" "}
                for trade pricing and saved details.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
