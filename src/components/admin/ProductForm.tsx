"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import { saveProduct } from "@/services/admin/products";
import type { Product } from "@/types/domain";

export function ProductForm({ initial }: { initial?: Product | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setSaved(false);

    const payload = {
      id: initial?.id,
      slug: String(formData.get("slug") ?? ""),
      name: String(formData.get("name") ?? ""),
      kind: formData.get("kind") as "hire" | "retail" | "both",
      status: formData.get("status") as "draft" | "active" | "archived",
      category: (formData.get("category") as string) || null,
      fabric: (formData.get("fabric") as string) || null,
      colour: (formData.get("colour") as string) || null,
      size: (formData.get("size") as string) || null,
      shortDescription: (formData.get("shortDescription") as string) || null,
      description: (formData.get("description") as string) || null,
      heroImageUrl: (formData.get("heroImageUrl") as string) || null,
      hirePriceCents: dollarsToCents(formData.get("hirePrice")),
      retailPriceCents: dollarsToCents(formData.get("retailPrice")),
      replacementCostCents: dollarsToCents(formData.get("replacementCost")),
      displayOrder: Number(formData.get("displayOrder") ?? 100),
    };

    startTransition(async () => {
      const result = await saveProduct(payload);
      if (!result.ok) {
        setError(result.error ?? "Couldn't save.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field name="name" label="Name" required defaultValue={initial?.name ?? ""} />
            <Field name="slug" label="Slug" required defaultValue={initial?.slug ?? ""} placeholder="scallop-napkin-bone" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select name="kind" label="Kind" defaultValue={initial?.kind ?? "hire"}>
              <option value="hire">Hire</option>
              <option value="retail">Retail</option>
              <option value="both">Hire & Retail</option>
            </Select>
            <Select name="status" label="Status" defaultValue={initial?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field name="category" label="Category" defaultValue={initial?.category ?? ""} placeholder="napkin" />
            <Field name="colour" label="Colour" defaultValue={initial?.colour ?? ""} placeholder="Bone" />
            <Field name="size" label="Size" defaultValue={initial?.size ?? ""} placeholder="50 × 50 cm" />
          </div>
          <Field name="fabric" label="Fabric" defaultValue={initial?.fabric ?? ""} placeholder="100% French linen, scallop edge" />
          <div>
            <label className="field-label">Short description</label>
            <textarea
              name="shortDescription"
              rows={2}
              defaultValue={initial?.shortDescription ?? ""}
              className="field-textarea"
            />
          </div>
          <div>
            <label className="field-label">Long description</label>
            <textarea
              name="description"
              rows={6}
              defaultValue={initial?.description ?? ""}
              className="field-textarea"
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6">
            <p className="eyebrow text-clay-500 mb-4">Pricing</p>
            <div className="space-y-4">
              <Field
                name="hirePrice"
                label="Hire price (NZD)"
                type="number"
                step="0.01"
                defaultValue={initial?.hirePriceCents != null ? (initial.hirePriceCents / 100).toString() : ""}
              />
              <Field
                name="retailPrice"
                label="Retail price (NZD)"
                type="number"
                step="0.01"
                defaultValue={initial?.retailPriceCents != null ? (initial.retailPriceCents / 100).toString() : ""}
              />
              <Field
                name="replacementCost"
                label="Replacement cost (NZD)"
                type="number"
                step="0.01"
                defaultValue={initial?.replacementCostCents != null ? (initial.replacementCostCents / 100).toString() : ""}
              />
            </div>
          </div>

          <div className="card p-6">
            <p className="eyebrow text-clay-500 mb-4">Display</p>
            <Field
              name="heroImageUrl"
              label="Hero image URL"
              defaultValue={initial?.heroImageUrl ?? ""}
              placeholder="https://…"
            />
            <Field
              name="displayOrder"
              label="Display order"
              type="number"
              defaultValue={initial?.displayOrder?.toString() ?? "100"}
              className="mt-4"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-clay-600 italic" role="alert">{error}</p>}
      {saved && <p className="text-sm text-olive-700 italic">Saved.</p>}

      <div className="flex items-center gap-3 sticky bottom-4 bg-cream-50/95 backdrop-blur p-4 rounded-md border border-[color:var(--color-rule-soft)] shadow-soft">
        <button type="submit" disabled={pending} className={cn("btn btn-clay", pending && "opacity-70")}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" strokeWidth={1.5} />}
          Save product
        </button>
      </div>
    </form>
  );
}

function dollarsToCents(input: FormDataEntryValue | null): number | null {
  if (input == null || input === "") return null;
  const n = Number(input);
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <div className={className}>
      <label className="field-label">{label}</label>
      <input {...rest} className="field-input" />
    </div>
  );
}

function Select({
  label,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select {...rest} className="field-select">{children}</select>
    </div>
  );
}
