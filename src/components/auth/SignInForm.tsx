"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { signIn } from "@/services/auth";

export function SignInForm({ next, compact }: { next?: string; compact?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    if (next) formData.set("next", next);
    startTransition(async () => {
      const result = await signIn(formData);
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
      <div>
        <label htmlFor="signin-email" className="field-label">Email</label>
        <input
          id="signin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@studio.co.nz"
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="signin-password" className="field-label">Password</label>
        <input
          id="signin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="field-input"
        />
      </div>

      {error && <p className="text-sm text-clay-600 italic" role="alert">{error}</p>}

      <button type="submit" disabled={pending} className={cn(compact ? "btn btn-secondary w-full !py-3" : "btn btn-clay w-full !py-4", pending && "opacity-70")}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {compact ? "Sign in & continue" : "Sign in"}
      </button>
    </form>
  );
}
