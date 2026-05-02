import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Calendar, MessageCircle, FileText } from "lucide-react";
import { BookingShell } from "@/components/booking/BookingShell";

export const metadata: Metadata = { title: "Hire — confirmed" };

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; demo?: string }>;
}) {
  const { ref, demo } = await searchParams;
  const reference = ref ?? "OLV-NEW";

  return (
    <BookingShell step={6}>
      <div className="max-w-2xl mx-auto text-center">
        <CheckCircle2 className="h-12 w-12 text-clay-500 mx-auto" strokeWidth={1.25} />
        <p className="eyebrow text-clay-500 mt-8 mb-4">{demo ? "Demo confirmation" : "Booking confirmed"}</p>
        <h1 className="font-display text-display-xl text-olive-900 leading-[0.96] tracking-tight">
          Thank you. <span className="italic font-light">We've got it from here.</span>
        </h1>
        <p className="mt-8 text-olive-800/85 text-lg leading-relaxed">
          Your booking <span className="font-display italic text-clay-500">{reference}</span> is
          {demo ? " saved as a demo draft." : " confirmed and locked into the studio calendar."}
          {!demo && " A confirmation email is on its way."}
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
        {[
          { icon: Calendar, title: "What's next", body: "We'll be in touch a week before to confirm timings and any final tweaks." },
          { icon: FileText, title: "Final balance", body: "Due 30 days before your event. We'll send a reminder — and you can pay from your portal." },
          { icon: MessageCircle, title: "Questions", body: "Message the studio anytime from your client portal — we read everything." },
        ].map((c) => (
          <div key={c.title} className="card p-6">
            <c.icon className="h-5 w-5 text-clay-500" strokeWidth={1.5} />
            <p className="eyebrow text-olive-600 mt-4">{c.title}</p>
            <p className="mt-2 text-sm text-olive-800 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 text-center flex flex-wrap items-center justify-center gap-3">
        <Link href="/account" className="btn">Open my portal</Link>
        <Link href="/" className="btn btn-secondary">Back to home</Link>
      </div>
    </BookingShell>
  );
}
