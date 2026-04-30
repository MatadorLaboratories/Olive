"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import { updateInternalNotes } from "@/services/admin/booking-actions";

export function InternalNotes({
  bookingId,
  initial,
}: {
  bookingId: string;
  initial: string | null;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const onSave = () => {
    startTransition(async () => {
      const result = await updateInternalNotes(bookingId, value);
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  return (
    <div className="card p-7">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-2xl text-olive-900">Internal notes</h2>
        <p className="text-[11px] uppercase tracking-[0.14em] text-olive-500">Not visible to client</p>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        placeholder="Notes for the studio team — packing, special requests, vendor coordination."
        className="field-textarea"
      />
      <div className="mt-3 flex items-center justify-between">
        {saved ? (
          <p className="text-[12px] uppercase tracking-[0.14em] text-olive-600">Saved.</p>
        ) : <span />}
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className={cn("btn btn-secondary !py-2.5 !text-[12px]", pending && "opacity-70")}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" strokeWidth={1.5} />}
          Save
        </button>
      </div>
    </div>
  );
}
