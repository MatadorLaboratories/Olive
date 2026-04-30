import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBookingByReference } from "@/services/bookings-read";
import { getMessagesForBooking } from "@/services/messaging";
import { MessageThread } from "@/components/portal/MessageThread";

type Params = { ref: string };

export default async function BookingMessagesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { ref } = await params;
  const booking = await getBookingByReference(ref);
  if (!booking) notFound();

  const messages = await getMessagesForBooking(ref);

  return (
    <div className="space-y-8 max-w-3xl">
      <Link
        href={`/account/bookings/${ref}`}
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Back to booking
      </Link>

      <header>
        <p className="eyebrow mb-3 tabular">{booking.reference}</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Talk to the <span className="italic font-light">studio.</span>
        </h1>
      </header>

      <MessageThread bookingReference={ref} initial={messages} />
    </div>
  );
}
