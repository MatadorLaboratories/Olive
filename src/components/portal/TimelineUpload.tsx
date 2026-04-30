"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { uploadTimeline } from "@/services/uploads";
import { cn } from "@/lib/cn";

export function TimelineUpload({ bookingReference }: { bookingReference: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSelect = () => inputRef.current?.click();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(false);
    const formData = new FormData();
    formData.set("bookingReference", bookingReference);
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadTimeline(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
    // Clear the input so re-selecting the same file fires `change` again.
    e.target.value = "";
  };

  return (
    <div className="card p-6">
      <p className="eyebrow text-clay-500 mb-3">Timeline & handover notes</p>
      <p className="text-sm text-olive-700 leading-relaxed mb-5">
        Upload your run-sheet, brief, or stylist's timeline so the studio knows when and where everything lands.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
        onChange={onChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={onSelect}
        disabled={pending}
        className={cn("btn btn-secondary !py-3 w-full", pending && "opacity-70")}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />}
        {pending ? "Uploading…" : "Upload timeline"}
      </button>

      {success && (
        <p className="mt-4 text-sm text-olive-800 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-clay-500 mt-0.5" strokeWidth={1.5} />
          Got it. The studio can see your timeline now.
        </p>
      )}
      {error && <p className="mt-4 text-sm text-clay-600 italic" role="alert">{error}</p>}

      <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-olive-500 flex items-center gap-2">
        <FileText className="h-3 w-3" strokeWidth={1.5} />
        PDF, image or .docx · 10 MB max
      </p>
    </div>
  );
}
