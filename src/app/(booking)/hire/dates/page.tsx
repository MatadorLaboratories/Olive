import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookingShell } from "@/components/booking/BookingShell";
import { DateField } from "@/components/booking/DateField";
import { getDraft } from "@/services/booking-draft";
import { saveBookingDates } from "@/services/booking-actions";

export const metadata: Metadata = {
  title: "Hire — choose your dates",
};

export default async function BookingDatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const draft = await getDraft();
  const d = draft.dates;

  return (
    <BookingShell step={1}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-4">Step 01 / Dates</p>
          <h1 className="font-display text-display-lg text-olive-900 leading-[1] tracking-tight">
            When's the <span className="italic font-light">soft Saturday?</span>
          </h1>
          <p className="mt-6 max-w-xl text-olive-800/80 text-lg leading-relaxed">
            Tell us your event date, and the days you'd like delivery and collection.
            We'll show you only what's available — no false promises.
          </p>

          {error && (
            <p className="mt-6 text-sm text-clay-600 italic" role="alert">
              {error === "window"
                ? "Delivery needs to be on or before the event, and collection needs to be on or after it."
                : "Please complete all required fields."}
            </p>
          )}

          <form action={saveBookingDates} className="mt-12 space-y-8 max-w-xl">
            <DateField
              id="eventDate"
              name="eventDate"
              label="Event date"
              hint="The day everyone sits down, the candles are lit, and the table earns its keep."
              defaultValue={d?.eventDate ?? ""}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateField
                id="deliveryDate"
                name="deliveryDate"
                label="Delivery date"
                hint="Usually the day before, pressed and folded for a calm setup."
                defaultValue={d?.deliveryDate ?? ""}
              />
              <DateField
                id="returnDate"
                name="returnDate"
                label="Return date"
                hint="Most collections happen the morning after, unless the venue needs otherwise."
                defaultValue={d?.returnDate ?? ""}
              />
            </div>
            <div>
              <label htmlFor="region" className="field-label">Region</label>
              <select
                id="region"
                name="region"
                defaultValue={d?.region ?? "queenstown"}
                className="field-select"
              >
                <option value="queenstown">Queenstown</option>
                <option value="wanaka">Wanaka</option>
                <option value="arrowtown">Arrowtown</option>
                <option value="central-otago">Central Otago</option>
                <option value="other">Elsewhere — tell us more</option>
              </select>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button type="submit" className="btn btn-clay">
                Continue to linen
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <Link href="/hire" className="btn btn-ghost">Back</Link>
            </div>
          </form>
        </div>

        <aside className="lg:col-span-5 lg:sticky lg:top-32 self-start">
          <div className="card p-7 lg:p-8">
            <p className="eyebrow text-clay-500 mb-3">A note from the studio</p>
            <p className="font-display text-2xl text-olive-900 leading-snug">
              We typically deliver the day before your event and collect the day after —
              but we'll work around your venue's schedule.
            </p>
            <hr className="my-7" />
            <p className="eyebrow text-olive-600 mb-3">The 30-day rule</p>
            <p className="text-olive-800/85 text-sm leading-relaxed">
              You can edit your booking up until 30 days before your event. After that,
              changes go through the studio so we can keep stock and laundering on track.
            </p>
          </div>
        </aside>
      </div>
    </BookingShell>
  );
}
