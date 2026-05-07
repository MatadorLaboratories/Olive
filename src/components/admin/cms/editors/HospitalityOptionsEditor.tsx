"use client";

import type { seedCms } from "@/data/seed/cms";
import { SectionEditor } from "../SectionEditor";
import { RepeatableList, TextField } from "../fields";

type HO = (typeof seedCms)["hospitality.options"];
type HODraft = {
  fabrics: { id: string; label: string }[];
  edges: { id: string; label: string }[];
  colours: { id: string; label: string; hex: string }[];
  quantityTiers: {
    id: string;
    label: string;
    priceFromCents: number | null;
    ppuCents: number | null;
  }[];
  customerTypes: { id: string; label: string }[];
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export function HospitalityOptionsEditor({ initial }: { initial: HO }) {
  const draft: HODraft = {
    fabrics: (initial.fabrics ?? []).map((f) => ({ id: f.id, label: f.label })),
    edges: (initial.edges ?? []).map((e) => ({ id: e.id, label: e.label })),
    colours: (initial.colours ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      hex: c.hex,
    })),
    quantityTiers: (initial.quantityTiers ?? []).map((t) => ({
      id: t.id,
      label: t.label,
      priceFromCents: t.priceFromCents,
      ppuCents: t.ppuCents,
    })),
    customerTypes: (initial.customerTypes ?? []).map((t) => ({
      id: t.id,
      label: t.label,
    })),
  };

  return (
    <SectionEditor<HODraft>
      cmsKey="hospitality.options"
      initial={draft}
      title={
        <>
          Hospitality <span className="italic font-light">builder options.</span>
        </>
      }
      description="The choices a customer sees in the napkin design studio — fabrics, edges, colour swatches, quantity tier pricing, and the customer-type options."
      previewHref="/hospitality/builder"
    >
      {(s, update) => (
        <>
          <section className="card p-7">
            <RepeatableList<{ id: string; label: string }>
              label="Fabrics"
              items={s.fabrics}
              onChange={(items) => update({ fabrics: items })}
              newItem={() => ({ id: "new_fabric", label: "New fabric" })}
              addLabel="Add fabric"
              renderItem={(item, _, set) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    label="ID (used in URLs / pricing)"
                    value={item.id}
                    onChange={(v) => set({ ...item, id: slug(v) })}
                  />
                  <TextField
                    label="Label"
                    value={item.label}
                    onChange={(v) => set({ ...item, label: v })}
                  />
                </div>
              )}
            />
          </section>

          <section className="card p-7">
            <RepeatableList<{ id: string; label: string }>
              label="Edges"
              items={s.edges}
              onChange={(items) => update({ edges: items })}
              newItem={() => ({ id: "new_edge", label: "New edge" })}
              addLabel="Add edge"
              renderItem={(item, _, set) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    label="ID"
                    value={item.id}
                    onChange={(v) => set({ ...item, id: slug(v) })}
                  />
                  <TextField
                    label="Label"
                    value={item.label}
                    onChange={(v) => set({ ...item, label: v })}
                  />
                </div>
              )}
            />
          </section>

          <section className="card p-7">
            <RepeatableList<{ id: string; label: string; hex: string }>
              label="Colour swatches"
              items={s.colours}
              onChange={(items) => update({ colours: items })}
              newItem={() => ({ id: "new_colour", label: "New colour", hex: "#cccccc" })}
              addLabel="Add colour"
              hint="Hex codes drive both the swatch in the builder and the napkin canvas fill."
              renderItem={(item, _, set) => (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <TextField
                    label="ID"
                    value={item.id}
                    onChange={(v) => set({ ...item, id: slug(v) })}
                  />
                  <TextField
                    label="Label"
                    value={item.label}
                    onChange={(v) => set({ ...item, label: v })}
                  />
                  <div>
                    <label className="field-label">Hex</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={item.hex}
                        onChange={(e) => set({ ...item, hex: e.target.value })}
                        className="h-10 w-14 rounded-md border border-[color:var(--border-base)] cursor-pointer bg-cream-50"
                      />
                      <input
                        type="text"
                        value={item.hex}
                        onChange={(e) => set({ ...item, hex: e.target.value })}
                        className="field-input"
                        placeholder="#EFE8D6"
                      />
                    </div>
                  </div>
                </div>
              )}
            />
          </section>

          <section className="card p-7">
            <RepeatableList<{
              id: string;
              label: string;
              priceFromCents: number | null;
              ppuCents: number | null;
            }>
              label="Quantity tiers"
              items={s.quantityTiers}
              onChange={(items) => update({ quantityTiers: items })}
              newItem={() => ({
                id: "new_tier",
                label: "New tier",
                priceFromCents: null,
                ppuCents: 1000,
              })}
              addLabel="Add tier"
              hint="Use either a flat from-price (gift sets) OR a per-piece rate (volume tiers). Cents = NZ$1.00 → 100."
              renderItem={(item, _, set) => (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <TextField
                    label="ID"
                    value={item.id}
                    onChange={(v) => set({ ...item, id: slug(v) })}
                  />
                  <TextField
                    label="Label"
                    value={item.label}
                    onChange={(v) => set({ ...item, label: v })}
                  />
                  <div>
                    <label className="field-label">From price (cents)</label>
                    <input
                      type="number"
                      value={item.priceFromCents ?? ""}
                      onChange={(e) =>
                        set({
                          ...item,
                          priceFromCents:
                            e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="field-input"
                      placeholder="—"
                    />
                  </div>
                  <div>
                    <label className="field-label">Per-piece (cents)</label>
                    <input
                      type="number"
                      value={item.ppuCents ?? ""}
                      onChange={(e) =>
                        set({
                          ...item,
                          ppuCents:
                            e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="field-input"
                      placeholder="—"
                    />
                  </div>
                </div>
              )}
            />
          </section>

          <section className="card p-7">
            <RepeatableList<{ id: string; label: string }>
              label="Customer types"
              items={s.customerTypes}
              onChange={(items) => update({ customerTypes: items })}
              newItem={() => ({ id: "new_type", label: "New type" })}
              addLabel="Add customer type"
              renderItem={(item, _, set) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    label="ID"
                    value={item.id}
                    onChange={(v) => set({ ...item, id: slug(v) })}
                  />
                  <TextField
                    label="Label"
                    value={item.label}
                    onChange={(v) => set({ ...item, label: v })}
                  />
                </div>
              )}
            />
          </section>
        </>
      )}
    </SectionEditor>
  );
}
