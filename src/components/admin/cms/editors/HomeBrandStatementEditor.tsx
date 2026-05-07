"use client";

import type { seedCms } from "@/data/seed/cms";
import { SectionEditor } from "../SectionEditor";
import {
  ImageField,
  RepeatableList,
  TextAreaField,
  TextField,
} from "../fields";

type BS = (typeof seedCms)["home.brand_statement"];
type BSDraft = {
  eyebrow: string;
  headlineLines: string[];
  body: string;
  stats: { label: string; value: string }[];
  pullQuote: { quote: string; attribution: string };
  images: string[];
};

export function HomeBrandStatementEditor({ initial }: { initial: BS }) {
  const draft: BSDraft = {
    eyebrow: initial.eyebrow ?? "",
    headlineLines: [...(initial.headlineLines ?? [])],
    body: initial.body ?? "",
    stats: (initial.stats ?? []).map((s) => ({ label: s.label, value: s.value })),
    pullQuote: { ...(initial.pullQuote ?? { quote: "", attribution: "" }) },
    images: [...(initial.images ?? [])],
  };

  return (
    <SectionEditor<BSDraft>
      cmsKey="home.brand_statement"
      initial={draft}
      title={
        <>
          The studio <span className="italic font-light">block.</span>
        </>
      }
      description="The brand statement that follows the hero — eyebrow, headline lines, body, stat counters, the pull quote, and supporting imagery."
      previewHref="/"
    >
      {(s, update) => (
        <>
          <section className="card p-7 space-y-5">
            <h2 className="font-display text-2xl text-olive-900">Heading + body</h2>
            <TextField
              label="Eyebrow"
              value={s.eyebrow}
              onChange={(v) => update({ eyebrow: v })}
            />
            <RepeatableList<string>
              label="Headline lines"
              items={s.headlineLines}
              onChange={(items) => update({ headlineLines: items })}
              newItem={() => ""}
              addLabel="Add line"
              renderItem={(item, idx, set) => (
                <TextField label={`Line ${idx + 1}`} value={item} onChange={set} />
              )}
            />
            <TextAreaField
              label="Body paragraph"
              value={s.body}
              onChange={(v) => update({ body: v })}
              rows={5}
            />
          </section>

          <section className="card p-7 space-y-5">
            <h2 className="font-display text-2xl text-olive-900">Stats</h2>
            <RepeatableList<{ label: string; value: string }>
              label="Quiet metrics"
              items={s.stats}
              onChange={(items) => update({ stats: items })}
              newItem={() => ({ label: "New stat", value: "0" })}
              addLabel="Add stat"
              hint="Editorial credibility numbers — keep the value concise."
              renderItem={(item, _, set) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    label="Label"
                    value={item.label}
                    onChange={(v) => set({ ...item, label: v })}
                    placeholder="Founded"
                  />
                  <TextField
                    label="Value"
                    value={item.value}
                    onChange={(v) => set({ ...item, value: v })}
                    placeholder="2022"
                  />
                </div>
              )}
            />
          </section>

          <section className="card p-7 space-y-5">
            <h2 className="font-display text-2xl text-olive-900">Pull quote</h2>
            <TextAreaField
              label="Quote"
              value={s.pullQuote.quote}
              onChange={(v) =>
                update({ pullQuote: { ...s.pullQuote, quote: v } })
              }
              rows={3}
            />
            <TextField
              label="Attribution"
              value={s.pullQuote.attribution}
              onChange={(v) =>
                update({ pullQuote: { ...s.pullQuote, attribution: v } })
              }
              placeholder="Vogue Living, Spring '24"
            />
          </section>

          <section className="card p-7 space-y-5">
            <h2 className="font-display text-2xl text-olive-900">Images</h2>
            <RepeatableList<string>
              label="Image cluster"
              items={s.images}
              onChange={(items) => update({ images: items })}
              newItem={() => ""}
              addLabel="Add image"
              hint="Two to four images work best in the editorial layout."
              renderItem={(item, idx, set) => (
                <ImageField
                  label={`Image ${idx + 1}`}
                  value={item}
                  onChange={(url) => set(url ?? "")}
                  cmsKey={`home.brand_statement.${idx + 1}`}
                  aspect="aspect-[4/5]"
                />
              )}
            />
          </section>
        </>
      )}
    </SectionEditor>
  );
}
