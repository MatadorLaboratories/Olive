"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import { saveCmsBlock } from "@/services/admin/cms";

/**
 * Generic CMS editor — exposes the JSON shape of any block as a textarea.
 * Phase 4 will replace this with field-level editors per block, but the
 * generic editor keeps every block editable from day one.
 */
export function CmsEditor({
  cmsKey,
  initial,
  label,
  description,
}: {
  cmsKey: string;
  initial: unknown;
  label: string;
  description: string;
}) {
  const [value, setValue] = useState(JSON.stringify(initial, null, 2));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      setError("That's not valid JSON.");
      return;
    }
    startTransition(async () => {
      // The keys are constrained at the type-system level by the cms service.
      const result = await saveCmsBlock(cmsKey as never, parsed);
      if (!result.ok) {
        setError(result.error ?? "Couldn't save.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="card p-7">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="font-display text-2xl text-olive-900">{label}</h2>
        <span className="text-[11px] uppercase tracking-[0.14em] text-olive-500 tabular">{cmsKey}</span>
      </div>
      <p className="text-sm text-olive-700 leading-relaxed mb-5">{description}</p>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={14}
        spellCheck={false}
        className="field-textarea !font-mono !text-[12px]"
      />

      {error && <p className="mt-3 text-sm text-clay-600 italic" role="alert">{error}</p>}
      {saved && <p className="mt-3 text-sm text-olive-700 italic">Saved · public site updates within seconds.</p>}

      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className={cn("btn btn-secondary !py-2.5 !text-[12px]", pending && "opacity-70")}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" strokeWidth={1.5} />}
          Save changes
        </button>
      </div>
    </div>
  );
}
