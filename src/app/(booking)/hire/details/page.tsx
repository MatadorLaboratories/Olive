import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BookingShell } from "@/components/booking/BookingShell";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { getDraft } from "@/services/booking-draft";
import { saveBookingDetails } from "@/services/booking-actions";

export const metadata: Metadata = { title: "Hire — details" };

export default async function BookingDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const draft = await getDraft();
  if (!draft.dates) redirect("/hire/dates");
  if (draft.items.length === 0) redirect("/hire/products");

  const det = draft.details;

  return (
    <BookingShell step={4}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-4">Step 04 / Details</p>
          <h1 className="font-display text-display-lg text-olive-900 leading-[1]">
            Where's the <span className="italic font-light">table?</span>
          </h1>

          {error && (
            <p className="mt-6 text-sm text-clay-600 italic" role="alert">
              Please fill in the required fields.
            </p>
          )}

          <form action={saveBookingDetails} className="mt-10 space-y-6 max-w-xl">
            <div>
              <label htmlFor="venue" className="field-label">Venue or address <span className="text-clay-500">*</span></label>
              <input
                id="venue"
                name="venue"
                type="text"
                required
                defaultValue={det?.venue ?? ""}
                placeholder="Glenorchy Estate"
                className="field-input"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deliveryWindow" className="field-label">Delivery window</label>
                <input
                  id="deliveryWindow"
                  name="deliveryWindow"
                  type="text"
                  defaultValue={det?.deliveryWindow ?? ""}
                  placeholder="9 – 11am"
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="collectionWindow" className="field-label">Collection window</label>
                <input
                  id="collectionWindow"
                  name="collectionWindow"
                  type="text"
                  defaultValue={det?.collectionWindow ?? ""}
                  placeholder="10am – 12pm"
                  className="field-input"
                />
              </div>
            </div>
            <div>
              <label htmlFor="onSiteContact" className="field-label">On-site contact <span className="text-clay-500">*</span></label>
              <input
                id="onSiteContact"
                name="onSiteContact"
                type="text"
                required
                defaultValue={det?.onSiteContact ?? ""}
                placeholder="Charlotte Eames — 027 000 0000"
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="notes" className="field-label">Notes for the studio</label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={det?.notes ?? ""}
                placeholder="Anything you'd like the studio to know"
                className="field-textarea"
              />
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button type="submit" className="btn">
                Continue to your account
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <Link href="/hire/quantities" className="btn btn-ghost">Back</Link>
            </div>
          </form>
        </div>
        <aside className="lg:col-span-5 lg:sticky lg:top-32 self-start">
          <BookingSummary draft={draft} />
        </aside>
      </div>
    </BookingShell>
  );
}
