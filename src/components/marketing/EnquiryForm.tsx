"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { submitEnquiry, type EnquiryInput } from "@/services/enquiries";

export function EnquiryForm({
  source = "contact",
  defaultMessage,
}: {
  source?: string;
  defaultMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="card p-10 text-center">
        <CheckCircle2 className="h-10 w-10 mx-auto text-clay-500" strokeWidth={1.5} />
        <p className="mt-6 font-display text-2xl text-olive-900 leading-snug">
          Thank you. We'll come back to you <span className="italic font-light">within one business day.</span>
        </p>
        <p className="mt-3 text-sm text-olive-600">In the meantime, browse the portfolio or follow us on Instagram.</p>
      </div>
    );
  }

  const onSubmit = (formData: FormData) => {
    setErrors({});
    setServerError(null);

    const payload: EnquiryInput = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: (formData.get("phone") as string) || null,
      eventDate: (formData.get("eventDate") as string) || null,
      message: String(formData.get("message") ?? ""),
      source,
    };

    startTransition(async () => {
      const result = await submitEnquiry(payload);
      if (!result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
        return;
      }
      setDone(true);
    });
  };

  return (
    <form action={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="enq-name" className="field-label">Your name <span className="text-clay-500">*</span></label>
          <input id="enq-name" name="name" type="text" required className="field-input" />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="enq-email" className="field-label">Email <span className="text-clay-500">*</span></label>
          <input id="enq-email" name="email" type="email" required className="field-input" />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="enq-phone" className="field-label">Phone</label>
          <input id="enq-phone" name="phone" type="tel" className="field-input" />
        </div>
        <div>
          <label htmlFor="enq-date" className="field-label">Event date <span className="text-olive-400">(if known)</span></label>
          <input id="enq-date" name="eventDate" type="date" className="field-input" />
        </div>
      </div>

      <div>
        <label htmlFor="enq-message" className="field-label">Tell us about it <span className="text-clay-500">*</span></label>
        <textarea
          id="enq-message"
          name="message"
          rows={6}
          required
          defaultValue={defaultMessage}
          placeholder="A few lines on your event, the kind of feel you're after, anything that helps us write back well."
          className="field-textarea"
        />
        {errors.message && <p className="field-error">{errors.message}</p>}
      </div>

      {serverError && (
        <p className="text-sm text-clay-600 italic" role="alert">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn("btn !py-4", pending && "opacity-70")}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
        Send to studio
      </button>

      <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
        We read every enquiry. We don't pass on your details.
      </p>
    </form>
  );
}
