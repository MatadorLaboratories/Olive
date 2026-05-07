"use client";

import type { seedCms } from "@/data/seed/cms";
import { SectionEditor } from "../SectionEditor";
import {
  ImageField,
  RepeatableList,
  TextAreaField,
  TextField,
} from "../fields";

type AB = (typeof seedCms)["about.body"];
type ABDraft = {
  eyebrow: string;
  headlineLines: string[];
  body: string;
  promiseQuote: string;
  blocks: { title: string; body: string }[];
  coverImage: string;
};

export function AboutBodyEditor({ initial }: { initial: AB }) {
  const draft: ABDraft = {
    eyebrow: initial.eyebrow ?? "",
    headlineLines: [...(initial.headlineLines ?? [])],
    body: initial.body ?? "",
    promiseQuote: initial.promiseQuote ?? "",
    blocks: (initial.blocks ?? []).map((b) => ({ title: b.title, body: b.body })),
    coverImage: initial.coverImage ?? "",
  };

  return (
    <SectionEditor<ABDraft>
      cmsKey="about.body"
      initial={draft}
      title={
        <>
          About <span className="italic font-light">page body.</span>
        </>
      }
      description="The studio narrative — hero copy, promise quote, three info blocks, and the cover photo."
      previewHref="/about"
    >
      {(s, update) => (
        <>
          <section className="card p-7 space-y-5">
            <h2 className="font-display text-2xl text-olive-900">Hero</h2>
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
            <h2 className="font-display text-2xl text-olive-900">Promise quote</h2>
            <TextAreaField
              label="Promise quote"
              value={s.promiseQuote}
              onChange={(v) => update({ promiseQuote: v })}
              hint="Italic-set sentence under the body — the studio's promise to the reader."
              rows={3}
            />
          </section>

          <section className="card p-7 space-y-5">
            <h2 className="font-display text-2xl text-olive-900">Info blocks</h2>
            <RepeatableList<{ title: string; body: string }>
              label="Three quick blocks"
              items={s.blocks}
              onChange={(items) => update({ blocks: items })}
              newItem={() => ({ title: "New block", body: "" })}
              addLabel="Add block"
              renderItem={(item, _, set) => (
                <div className="space-y-3">
                  <TextField
                    label="Title"
                    value={item.title}
                    onChange={(v) => set({ ...item, title: v })}
                  />
                  <TextAreaField
                    label="Body"
                    value={item.body}
                    onChange={(v) => set({ ...item, body: v })}
                    rows={3}
                  />
                </div>
              )}
            />
          </section>

          <section className="card p-7 space-y-5">
            <h2 className="font-display text-2xl text-olive-900">Cover image</h2>
            <ImageField
              label="Cover photo"
              value={s.coverImage}
              onChange={(url) => update({ coverImage: url ?? "" })}
              cmsKey="about.body.cover"
              aspect="aspect-[16/9]"
            />
          </section>
        </>
      )}
    </SectionEditor>
  );
}
