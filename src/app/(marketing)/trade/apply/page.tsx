import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { VendorApplicationForm } from "@/components/marketing/VendorApplicationForm";

export const metadata: Metadata = {
  title: "Trade application",
  description: "Apply for an Olive Linen trade account — wedding planners, stylists, venues, hospitality.",
};

export default function TradeApplyPage() {
  return (
    <>
      <PageHero
        eyebrow="Trade · Apply"
        title={
          <>
            Apply for a <span className="italic font-light">trade account.</span>
          </>
        }
        body={
          <>
            For wedding planners, stylists, venues and hospitality clients with a working
            volume with us. Approved trade accounts get tiered discounts, saved venues, and
            faster repeat bookings inside the trade portal.
          </>
        }
      />

      <section className="bg-canvas pb-32">
        <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <VendorApplicationForm />
          </div>

          <aside className="lg:col-span-5">
            <div className="card p-7">
              <p className="eyebrow text-clay-500 mb-4">What you get</p>
              <ul className="space-y-4 text-olive-800/85 leading-relaxed">
                <li>
                  <p className="font-display text-olive-900 text-lg">Tiered discount</p>
                  <p className="text-sm">Trade-10, Trade-15, or Trade-20 depending on cadence and volume — applied automatically at checkout.</p>
                </li>
                <li>
                  <p className="font-display text-olive-900 text-lg">Saved details</p>
                  <p className="text-sm">Save venues, planner contacts, recurring orders. Re-book in two clicks.</p>
                </li>
                <li>
                  <p className="font-display text-olive-900 text-lg">Spend tracking</p>
                  <p className="text-sm">Year-to-date spend and statement export by month for your accountant.</p>
                </li>
                <li>
                  <p className="font-display text-olive-900 text-lg">Direct line</p>
                  <p className="text-sm">A dedicated thread with the studio that travels across every booking.</p>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
