"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

type UploadResult = { ok: true; url: string } | { ok: false; error: string };
type RemoveResult = { ok: true } | { ok: false; error: string };

const ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/svg+xml";

/**
 * `ImageUploader` — single-image variant.
 *
 * Shows the current image (if any), accepts a drag-or-click upload, calls
 * the supplied `upload` server action, and reports state. The server action
 * receives a FormData with `file` plus any `extra` fields the caller passes
 * (slug, kind, etc).
 */
export function ImageUploader({
  label,
  hint,
  current,
  upload,
  remove,
  extra = {},
  aspect = "aspect-[4/5]",
}: {
  label: string;
  hint?: string;
  current: string | null;
  upload: (formData: FormData) => Promise<UploadResult>;
  remove?: () => Promise<RemoveResult>;
  /** Extra string fields appended to the FormData. */
  extra?: Record<string, string>;
  aspect?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showUrl = optimisticUrl ?? current;

  const handleFile = (file: File | null) => {
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    for (const [k, v] of Object.entries(extra)) fd.set(k, v);

    // Optimistic local preview while the upload runs.
    const localUrl = URL.createObjectURL(file);
    setOptimisticUrl(localUrl);

    startTransition(async () => {
      const result = await upload(fd);
      URL.revokeObjectURL(localUrl);
      if (!result.ok) {
        setOptimisticUrl(null);
        setError(result.error);
        return;
      }
      setOptimisticUrl(null);
      setSavedAt(Date.now());
    });
  };

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    handleFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const onRemove = () => {
    if (!remove) return;
    setError(null);
    startTransition(async () => {
      const result = await remove();
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div>
      <label className="field-label">{label}</label>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "relative w-full overflow-hidden rounded-md border border-[color:var(--border-base)] bg-[color:var(--color-paper)] transition-colors",
          showUrl ? "" : "border-dashed",
          aspect,
        )}
      >
        {showUrl ? (
          <Image
            src={showUrl}
            alt={label}
            fill
            sizes="(min-width: 1024px) 30vw, 80vw"
            className={cn(
              "object-cover transition-opacity",
              pending && "opacity-70",
            )}
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 grid place-items-center text-olive-600 hover:text-olive-900 transition-colors"
          >
            <span className="flex flex-col items-center gap-2">
              <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[12px] uppercase tracking-[0.16em]">
                Drop or click to upload
              </span>
            </span>
          </button>
        )}

        {pending && (
          <div className="absolute inset-0 grid place-items-center bg-cream-50/40">
            <Loader2
              className="h-5 w-5 text-olive-700 animate-spin"
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onPick}
        className="sr-only"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
          {hint ?? "PNG, JPG, WebP, AVIF or SVG · 12 MB max"}
        </div>
        <div className="flex items-center gap-2">
          {showUrl && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              className="text-[11px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors disabled:opacity-50"
            >
              Replace
            </button>
          )}
          {showUrl && remove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-olive-500 hover:text-clay-600 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" strokeWidth={1.5} />
              Remove
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-[12px] text-clay-600 italic" role="alert">
          {error}
        </p>
      )}
      {savedAt && !error && !pending && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-olive-600">
          <CheckCircle2
            className="h-3 w-3 text-olive-700"
            strokeWidth={1.5}
          />
          Saved.
        </p>
      )}
    </div>
  );
}

/**
 * `ImageGalleryUploader` — multi-image variant with reorder + remove.
 *
 * Mirrors the single-uploader API but renders a thumbnail grid and an "add"
 * tile. Each thumbnail has up/down/remove buttons. Reorder calls
 * `reorder(urls)` and remove calls `remove(url)`.
 */
export function ImageGalleryUploader({
  label,
  hint,
  current,
  upload,
  remove,
  reorder,
  extra = {},
}: {
  label: string;
  hint?: string;
  current: string[];
  upload: (formData: FormData) => Promise<UploadResult>;
  remove: (url: string) => Promise<RemoveResult>;
  reorder: (urls: string[]) => Promise<RemoveResult>;
  extra?: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<string[]>(current);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    startTransition(async () => {
      const result = await upload(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems((prev) => [...prev, result.url]);
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [picked] = next.splice(from, 1);
    if (picked === undefined) return;
    next.splice(to, 0, picked);
    setItems(next);
    setError(null);
    startTransition(async () => {
      const result = await reorder(next);
      if (!result.ok) setError(result.error);
    });
  };

  const onRemove = (url: string) => {
    setError(null);
    setItems((prev) => prev.filter((u) => u !== url));
    startTransition(async () => {
      const result = await remove(url);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="field-label">{label}</label>
        <span className="text-[11px] uppercase tracking-[0.14em] text-olive-500">
          {items.length} {items.length === 1 ? "image" : "images"}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((url, i) => (
          <article
            key={url}
            className="group relative aspect-square overflow-hidden rounded-md border border-[color:var(--border-base)] bg-[color:var(--color-paper)]"
          >
            <Image
              src={url}
              alt={`${label} ${i + 1}`}
              fill
              sizes="200px"
              className="object-cover"
            />
            <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/0 via-black/0 to-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-end p-1.5 gap-1">
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  disabled={pending}
                  aria-label="Remove image"
                  className="h-7 w-7 grid place-items-center rounded-full bg-cream-50/95 text-olive-900 hover:bg-cream-50 transition-colors disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.6} />
                </button>
              </div>
              <div className="flex items-center justify-between p-1.5 gap-1">
                <span className="text-[10px] uppercase tracking-[0.16em] text-cream-50/85 px-2 py-1 rounded-full bg-black/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={pending || i === 0}
                    aria-label="Move earlier"
                    className="h-7 w-7 grid place-items-center rounded-full bg-cream-50/95 text-olive-900 hover:bg-cream-50 transition-colors disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={pending || i === items.length - 1}
                    aria-label="Move later"
                    className="h-7 w-7 grid place-items-center rounded-full bg-cream-50/95 text-olive-900 hover:bg-cream-50 transition-colors disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.6} />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className={cn(
            "aspect-square rounded-md border border-dashed border-[color:var(--border-base)] bg-[color:var(--color-paper)] grid place-items-center text-olive-600 hover:text-olive-900 hover:border-olive-700 transition-colors disabled:opacity-60",
          )}
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
          ) : (
            <span className="flex flex-col items-center gap-2">
              <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[11px] uppercase tracking-[0.16em]">
                Add image
              </span>
            </span>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onPick}
        className="sr-only"
      />

      <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-olive-500">
        {hint ?? "PNG, JPG, WebP, AVIF or SVG · drag to reorder via arrows"}
      </p>
      {error && (
        <p className="mt-2 text-[12px] text-clay-600 italic" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
