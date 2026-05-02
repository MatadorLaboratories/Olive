"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  convertEnquiryToBooking,
  markEnquiryInProgress,
} from "@/services/admin/enquiry-actions";

/**
 * Reply + Convert buttons on the enquiries inbox row.
 *
 * Reply: opens the studio's mail client with the enquiry email pre-filled,
 * and marks the enquiry `in_progress` so the inbox stops surfacing it as new.
 *
 * Convert: spins the enquiry into a draft booking and routes the admin
 * straight into the new booking detail.
 */
export function EnquiryRowActions({
  enquiryId,
  email,
  name,
  message,
}: {
  enquiryId: string;
  email: string;
  name: string;
  message: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onReply = () => {
    setError(null);
    const subject = encodeURIComponent(`Re: your enquiry — Olive Linen`);
    const greeting = name ? name.split(" ")[0] : "there";
    const quote = message
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n");
    const body = encodeURIComponent(
      `Hi ${greeting},\n\nThanks for writing in. \n\n— Olive Linen\n\n${quote}`,
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
    // Best-effort status update; reply happens out-of-band.
    startTransition(async () => {
      await markEnquiryInProgress(enquiryId);
    });
  };

  const onConvert = () => {
    setError(null);
    startTransition(async () => {
      const result = await convertEnquiryToBooking(enquiryId);
      if (result && !result.ok) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <button
        type="button"
        onClick={onReply}
        disabled={pending}
        className={cn(
          "btn !py-2.5 !text-[12px]",
          pending && "opacity-70",
        )}
      >
        Reply
      </button>
      <button
        type="button"
        onClick={onConvert}
        disabled={pending}
        className={cn(
          "btn btn-secondary !py-2.5 !text-[12px]",
          pending && "opacity-70",
        )}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
        )}
        Convert
      </button>
      {error && (
        <p className="text-[11px] text-clay-600 italic max-w-[10rem]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
