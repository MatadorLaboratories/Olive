"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { saveCmsBlock } from "@/services/admin/cms";
import type { SeedCmsKey } from "@/data/seed/cms";

/**
 * Shell for a structured CMS section editor.
 *
 * Each per-section page (Hero, Brand statement, About body, FAQs, etc.)
 * passes the typed initial data + a render function that builds the
 * fields. This component handles loading/saving state, the back-link,
 * the preview-link, and the save bar.
 */
export function SectionEditor<T>({
  cmsKey,
  initial,
  title,
  description,
  previewHref,
  validate,
  children,
}: {
  cmsKey: SeedCmsKey;
  initial: T;
  title: React.ReactNode;
  description?: string;
  previewHref?: string;
  /** Optional client-side validator. Returns string[] of issues; empty = ok. */
  validate?: (value: T) => string[];
  /** Render-prop receiving the current state and an `update` patcher. */
  children: (
    state: T,
    update: (patch: Partial<T> | ((prev: T) => T)) => void,
  ) => React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<T>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<T> | ((prev: T) => T)) => {
    setError(null);
    setSaved(false);
    setState((prev) =>
      typeof patch === "function"
        ? (patch as (p: T) => T)(prev)
        : ({ ...prev, ...patch } as T),
    );
  };

  const onSave = () => {
    setError(null);
    if (validate) {
      const issues = validate(state);
      if (issues.length > 0) {
        setError(issues.join(" · "));
        return;
      }
    }
    startTransition(async () => {
      const result = await saveCmsBlock(cmsKey, state);
      if (!result.ok) {
        setError(result.error ?? "Couldn't save.");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2400);
    });
  };

  return (
    <div className="space-y-10 max-w-4xl pb-32">
      <Link
        href="/admin/cms"
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        All CMS sections
      </Link>

      <header>
        <p className="eyebrow text-clay-500 mb-3">CMS · {cmsKey}</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-olive-800/85 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
        {previewHref && (
          <Link
            href={previewHref}
            target="_blank"
            className="mt-4 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
          >
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
            Preview live page
          </Link>
        )}
      </header>

      <div className="space-y-7">{children(state, update)}</div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-30 flex items-center gap-3 bg-[color:var(--color-paper)]/95 backdrop-blur p-4 rounded-md border border-[color:var(--border-soft)] shadow-soft">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className={cn("btn", pending && "opacity-70")}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          Save changes
        </button>
        {error && (
          <p className="text-sm text-clay-600 italic" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="text-sm text-olive-700 italic">
            Saved. Public site updates within seconds.
          </p>
        )}
      </div>
    </div>
  );
}
