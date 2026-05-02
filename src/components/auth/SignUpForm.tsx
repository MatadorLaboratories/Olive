"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { signUp } from "@/services/auth";

export function SignUpForm({
  next,
  compact,
  defaultEmail,
}: {
  next?: string;
  compact?: boolean;
  defaultEmail?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    if (next) formData.set("next", next);

    const first = String(formData.get("firstName") ?? "").trim();
    const last = String(formData.get("lastName") ?? "").trim();
    const fullName = first || last ? `${first} ${last}`.trim() : "";
    formData.set("fullName", fullName);

    startTransition(async () => {
      const result = await signUp(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.data?.next ?? "/account");
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="su-first" className="field-label">First name</label>
          <input id="su-first" name="firstName" type="text" required autoComplete="given-name" className="field-input" />
        </div>
        <div>
          <label htmlFor="su-last" className="field-label">Last name</label>
          <input id="su-last" name="lastName" type="text" required autoComplete="family-name" className="field-input" />
        </div>
      </div>
      <div>
        <label htmlFor="su-email" className="field-label">Email</label>
        <input id="su-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" defaultValue={defaultEmail ?? ""} className="field-input" />
      </div>
      <div>
        <label htmlFor="su-password" className="field-label">Password</label>
        <input id="su-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field-input" />
        <p className="text-[11px] tracking-wide text-olive-500 mt-2">At least 8 characters.</p>
      </div>

      {error && <p className="text-sm text-clay-600 italic" role="alert">{error}</p>}

      <button type="submit" disabled={pending} className={cn("btn w-full !py-4", pending && "opacity-70")}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {compact ? "Create & continue" : "Create account"}
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </form>
  );
}
