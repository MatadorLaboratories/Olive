"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { applyAsVendor, type VendorApplicationInput } from "@/services/vendor-application";

export function VendorApplicationForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="card p-10 text-center">
        <CheckCircle2 className="h-10 w-10 mx-auto text-clay-500" strokeWidth={1.5} />
        <p className="mt-6 font-display text-2xl text-olive-900 leading-snug">
          Application received.
          <span className="block italic font-light">We'll review and approve within two business days.</span>
        </p>
        <p className="mt-3 text-sm text-olive-600">
          We'll email you once your trade tier is set — then you can sign in and book on behalf of clients.
        </p>
      </div>
    );
  }

  const onSubmit = (formData: FormData) => {
    setErrors({});
    setServerError(null);
    const payload: VendorApplicationInput = {
      businessName: String(formData.get("businessName") ?? ""),
      vendorType: formData.get("vendorType") as VendorApplicationInput["vendorType"],
      region: (formData.get("region") as string) || null,
      contactName: String(formData.get("contactName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: (formData.get("phone") as string) || null,
      abnOrNzbn: (formData.get("abnOrNzbn") as string) || null,
      password: String(formData.get("password") ?? ""),
      notes: (formData.get("notes") as string) || null,
    };
    startTransition(async () => {
      const result = await applyAsVendor(payload);
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
        <Field name="businessName" label="Business name" required error={errors.businessName} />
        <div>
          <label className="field-label">Vendor type <span className="text-clay-500">*</span></label>
          <select name="vendorType" required defaultValue="planner" className="field-select">
            <option value="planner">Wedding planner</option>
            <option value="stylist">Stylist</option>
            <option value="venue">Venue</option>
            <option value="wholesale">Wholesale / hospitality</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="contactName" label="Contact name" required error={errors.contactName} />
        <Field name="region" label="Region" placeholder="Queenstown" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="email" label="Email" type="email" required autoComplete="email" error={errors.email} />
        <Field name="phone" label="Phone" type="tel" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="abnOrNzbn" label="NZBN / ABN (optional)" />
        <Field name="password" label="Password (8+ characters)" type="password" required minLength={8} autoComplete="new-password" error={errors.password} />
      </div>
      <div>
        <label className="field-label">Anything else we should know?</label>
        <textarea
          name="notes"
          rows={4}
          placeholder="Volume per year, type of clients, the kind of linen you reach for."
          className="field-textarea"
        />
      </div>

      {serverError && <p className="text-sm text-clay-600 italic" role="alert">{serverError}</p>}

      <button
        type="submit"
        disabled={pending}
        className={cn("btn !py-4", pending && "opacity-70")}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" strokeWidth={1.5} />}
        Submit application
      </button>

      <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500 leading-relaxed">
        Trade applications are reviewed by hand and usually approved within two business days.
      </p>
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const { label, error, className, ...rest } = props;
  return (
    <div className={className}>
      <label className="field-label">
        {label}{rest.required && <span className="text-clay-500"> *</span>}
      </label>
      <input {...rest} className="field-input" />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
