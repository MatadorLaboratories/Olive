"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/services/newsletter";
import { cn } from "@/lib/cn";

export function NewsletterForm() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await subscribeToNewsletter(formData);
      if (!result.ok) {
        setError(result.error);
        setState("error");
        return;
      }
      setState("ok");
    });
  };

  if (state === "ok") {
    return (
      <p className="font-display italic text-cream-100 text-xl max-w-lg leading-snug">
        You're on the list. The next letter from the studio will land soon.
      </p>
    );
  }

  return (
    <form action={onSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg" aria-label="Newsletter signup">
      <input
        type="email"
        name="email"
        required
        placeholder="your@email.com"
        aria-label="Email address"
        className="flex-1 bg-transparent border-b border-cream-100/30 focus:border-clay-300 outline-none px-1 py-3 text-cream-100 placeholder:text-cream-100/40 transition-colors"
      />
      <button
        type="submit"
        disabled={pending}
        className={cn("btn !rounded-none sm:!rounded-full whitespace-nowrap", pending && "opacity-70")}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Subscribe<ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} /></>}
      </button>
      {error && (
        <p className="absolute mt-16 text-xs text-clay-300" role="alert">{error}</p>
      )}
    </form>
  );
}
