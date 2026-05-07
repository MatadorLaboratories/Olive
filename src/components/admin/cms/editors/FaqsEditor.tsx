"use client";

import type { seedCms } from "@/data/seed/cms";
import { SectionEditor } from "../SectionEditor";
import { RepeatableList, TextAreaField, TextField } from "../fields";

type Faqs = (typeof seedCms)["faqs"];

export function FaqsEditor({ initial }: { initial: Faqs }) {
  const draft = (initial ?? []).map((f) => ({ q: f.q, a: f.a }));
  return (
    <SectionEditor<{ q: string; a: string }[]>
      cmsKey="faqs"
      initial={draft}
      title={
        <>
          Frequently asked <span className="italic font-light">questions.</span>
        </>
      }
      description="Accordion list on the About page. One question + answer per item."
      previewHref="/about"
    >
      {(state, update) => (
        <section className="card p-7">
          <RepeatableList<{ q: string; a: string }>
            label="Questions"
            items={state}
            onChange={(items) => update(() => items)}
            newItem={() => ({ q: "New question?", a: "Answer." })}
            addLabel="Add FAQ"
            renderItem={(item, _, set) => (
              <div className="space-y-3">
                <TextField
                  label="Question"
                  value={item.q}
                  onChange={(v) => set({ ...item, q: v })}
                />
                <TextAreaField
                  label="Answer"
                  value={item.a}
                  onChange={(v) => set({ ...item, a: v })}
                  rows={4}
                />
              </div>
            )}
          />
        </section>
      )}
    </SectionEditor>
  );
}
