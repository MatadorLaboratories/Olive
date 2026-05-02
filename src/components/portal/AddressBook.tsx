"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { saveVendorAddress, deleteVendorAddress, type AddressInput } from "@/services/vendor-actions";
import type { VendorAddress } from "@/services/vendor";

export function AddressBook({ initial }: { initial: VendorAddress[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const cancel = () => {
    setEditing(null);
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      {initial.map((a) =>
        editing === a.id ? (
          <AddressForm
            key={a.id}
            initial={a}
            onDone={() => {
              cancel();
              router.refresh();
            }}
          />
        ) : (
          <article key={a.id} className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-xl text-olive-900">{a.label}</p>
                <p className="mt-1 text-sm text-olive-700 leading-snug">
                  {[a.addressLine, a.city, a.region].filter(Boolean).join(", ")}
                </p>
                {(a.contactName || a.contactPhone) && (
                  <p className="mt-2 text-[12px] uppercase tracking-[0.12em] text-olive-500">
                    {a.contactName} {a.contactPhone && <span className="tabular">· {a.contactPhone}</span>}
                  </p>
                )}
                {a.notes && (
                  <p className="mt-3 text-sm text-olive-700 italic font-display max-w-md">{a.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => setEditing(a.id)} className="text-[11px] uppercase tracking-[0.12em] text-olive-700 hover:text-clay-500">
                  Edit
                </button>
                <DeleteButton id={a.id} onDeleted={() => router.refresh()} />
              </div>
            </div>
          </article>
        ),
      )}

      {creating && (
        <AddressForm
          onDone={() => {
            cancel();
            router.refresh();
          }}
        />
      )}

      {!creating && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="card p-6 w-full text-left text-olive-700 hover:border-olive-300 transition-colors flex items-center gap-3"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          <span className="font-display text-lg">Add a venue or address</span>
        </button>
      )}
    </div>
  );
}

function AddressForm({
  initial,
  onDone,
}: {
  initial?: VendorAddress;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: AddressInput = {
      id: initial?.id,
      label: String(fd.get("label") ?? ""),
      addressLine: (fd.get("addressLine") as string) || null,
      city: (fd.get("city") as string) || null,
      region: (fd.get("region") as string) || null,
      contactName: (fd.get("contactName") as string) || null,
      contactPhone: (fd.get("contactPhone") as string) || null,
      notes: (fd.get("notes") as string) || null,
    };
    startTransition(async () => {
      const result = await saveVendorAddress(payload);
      if (!result.ok) {
        setError(result.error ?? "Couldn't save.");
        return;
      }
      onDone();
    });
  };

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field name="label" label="Label" required defaultValue={initial?.label ?? ""} />
        <Field name="addressLine" label="Address" defaultValue={initial?.addressLine ?? ""} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field name="city" label="City" defaultValue={initial?.city ?? ""} />
        <Field name="region" label="Region" defaultValue={initial?.region ?? ""} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field name="contactName" label="On-site contact" defaultValue={initial?.contactName ?? ""} />
        <Field name="contactPhone" label="Contact phone" defaultValue={initial?.contactPhone ?? ""} />
      </div>
      <div>
        <label className="field-label">Notes</label>
        <textarea name="notes" rows={3} defaultValue={initial?.notes ?? ""} className="field-textarea" />
      </div>
      {error && <p className="text-sm text-clay-600 italic">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="btn btn-ghost !text-[12px]">
          <X className="h-3 w-3" strokeWidth={1.5} />
          Cancel
        </button>
        <button type="submit" disabled={pending} className={cn("btn !py-2.5 !text-[12px]", pending && "opacity-70")}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" strokeWidth={1.5} />}
          Save
        </button>
      </div>
    </form>
  );
}

function DeleteButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-[11px] uppercase tracking-[0.12em] text-olive-500 hover:text-clay-500 inline-flex items-center gap-1">
        <Trash2 className="h-3 w-3" strokeWidth={1.5} />
        Remove
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          startTransition(async () => {
            await deleteVendorAddress(id);
            onDeleted();
          });
        }}
        disabled={pending}
        className="text-[11px] uppercase tracking-[0.12em] text-clay-600"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-[11px] uppercase tracking-[0.12em] text-olive-500">
        Cancel
      </button>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <div className={className}>
      <label className="field-label">{label}{rest.required && <span className="text-clay-500"> *</span>}</label>
      <input {...rest} className="field-input" />
    </div>
  );
}
