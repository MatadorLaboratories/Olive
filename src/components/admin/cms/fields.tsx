"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { uploadCmsImage } from "@/services/admin/cms-images";

/**
 * Reusable form controls for the structured CMS section editors.
 *
 * Goal: a non-technical client should be able to read the labels and edit
 * a section without seeing JSON. Every control here is a thin wrapper over
 * the Olive `field-*` styles so the editor visually matches the rest of
 * `/admin`.
 */

// ---------- TextField ----------
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="field-label">
        {label}
        {required && <span className="text-clay-500"> *</span>}
      </label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
      {hint && (
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-olive-500">
          {hint}
        </p>
      )}
    </div>
  );
}

// ---------- TextAreaField ----------
export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="field-textarea"
      />
      {hint && (
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-olive-500">
          {hint}
        </p>
      )}
    </div>
  );
}

// ---------- CTAField — label + href in a single grouped control ----------
export function CtaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { label: string; href: string };
  onChange: (v: { label: string; href: string }) => void;
}) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={value?.label ?? ""}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          placeholder="Button label"
          className="field-input"
        />
        <input
          type="text"
          value={value?.href ?? ""}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
          placeholder="/hire or https://…"
          className="field-input"
        />
      </div>
    </div>
  );
}

// ---------- ImageField — upload-or-URL with thumbnail + replace + remove ----------
export function ImageField({
  label,
  value,
  onChange,
  cmsKey,
  hint,
  aspect = "aspect-[4/3]",
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  cmsKey: string;
  hint?: string;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("cmsKey", cmsKey);
    startTransition(async () => {
      const result = await uploadCmsImage(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChange(result.url);
    });
    e.target.value = "";
  };

  return (
    <div>
      <label className="field-label">{label}</label>

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-md border border-[color:var(--border-base)] bg-[color:var(--color-paper)]",
          value ? "" : "border-dashed",
          aspect,
        )}
      >
        {value ? (
          <Image
            src={value}
            alt={label}
            fill
            sizes="(min-width: 1024px) 30vw, 80vw"
            className={cn("object-cover transition-opacity", pending && "opacity-70")}
            unoptimized
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 grid place-items-center text-olive-600 hover:text-olive-900 transition-colors"
          >
            <span className="flex flex-col items-center gap-2">
              <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[11px] uppercase tracking-[0.16em]">
                Click to upload
              </span>
            </span>
          </button>
        )}

        {pending && (
          <div className="absolute inset-0 grid place-items-center bg-cream-50/40">
            <Loader2 className="h-5 w-5 text-olive-700 animate-spin" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
        onChange={onPick}
        className="sr-only"
      />

      {/* URL field for direct paste / external sources */}
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Image URL (or upload above)"
        className="field-input mt-3 !text-[12px]"
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-olive-500">
          {hint ?? "PNG, JPG, WebP, AVIF or SVG · 12 MB max"}
        </p>
        <div className="flex items-center gap-3">
          {value && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              className="text-[11px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
            >
              Replace
            </button>
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-olive-500 hover:text-clay-600 transition-colors"
            >
              <Trash2 className="h-3 w-3" strokeWidth={1.5} />
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-[12px] text-clay-600 italic">{error}</p>}
    </div>
  );
}

// ---------- RepeatableList — generic add / remove / reorder list ----------
export function RepeatableList<T>({
  label,
  items,
  onChange,
  newItem,
  renderItem,
  addLabel = "Add item",
  hint,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, idx: number, update: (it: T) => void) => React.ReactNode;
  addLabel?: string;
  hint?: string;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [picked] = next.splice(from, 1);
    if (picked === undefined) return;
    next.splice(to, 0, picked);
    onChange(next);
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, it: T) =>
    onChange(items.map((cur, i) => (i === idx ? it : cur)));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="field-label !mb-0">{label}</p>
        <span className="text-[11px] uppercase tracking-[0.12em] text-olive-500">
          {items.length}
        </span>
      </div>

      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-[0.14em] text-olive-500 tabular">
                #{String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]">
                <button
                  type="button"
                  onClick={() => move(idx, idx - 1)}
                  disabled={idx === 0}
                  className="text-olive-700 hover:text-clay-600 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, idx + 1)}
                  disabled={idx === items.length - 1}
                  className="text-olive-700 hover:text-clay-600 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-clay-600 hover:text-clay-700 inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                  Remove
                </button>
              </div>
            </div>
            {renderItem(item, idx, (it) => update(idx, it))}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChange([...items, newItem()])}
        className="btn btn-secondary !py-2.5 !text-[12px] mt-3"
      >
        + {addLabel}
      </button>

      {hint && (
        <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-olive-500">
          {hint}
        </p>
      )}
    </div>
  );
}
