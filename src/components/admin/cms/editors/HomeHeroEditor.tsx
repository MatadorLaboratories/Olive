"use client";

import type { seedCms } from "@/data/seed/cms";
import { SectionEditor } from "../SectionEditor";
import {
  CtaField,
  ImageField,
  RepeatableList,
  TextAreaField,
  TextField,
} from "../fields";

type Hero = (typeof seedCms)["home.hero"];
type HeroDraft = {
  eyebrow: string;
  headlineLines: string[];
  supporting: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  tagline: string;
  images: { primary: string; caption: string };
};

export function HomeHeroEditor({ initial }: { initial: Hero }) {
  // Coerce the const-typed seed shape to a mutable draft.
  const draft: HeroDraft = {
    eyebrow: initial.eyebrow ?? "",
    headlineLines: [...(initial.headlineLines ?? [])],
    supporting: initial.supporting ?? "",
    primaryCta: { ...(initial.primaryCta ?? { label: "", href: "" }) },
    secondaryCta: { ...(initial.secondaryCta ?? { label: "", href: "" }) },
    tagline: initial.tagline ?? "",
    images: {
      primary: initial.images?.primary ?? "",
      caption: initial.images?.caption ?? "",
    },
  };

  return (
    <SectionEditor<HeroDraft>
      cmsKey="home.hero"
      initial={draft}
      title={
        <>
          Homepage <span className="italic font-light">hero.</span>
        </>
      }
      description="The first thing visitors see. Eyebrow, headline lines, supporting text, two CTAs, the italic tagline and the hero photo."
      previewHref="/"
    >
      {(s, update) => (
        <>
          <section className="card p-7 space-y-5">
            <h2 className="font-display text-2xl text-olive-900">Headline</h2>
            <TextField
              label="Eyebrow"
              value={s.eyebrow}
              onChange={(v) => update({ eyebrow: v })}
              placeholder="Premium linen hire — Queenstown, Aotearoa"
              hint="Small uppercase line above the headline."
            />
            <RepeatableList<string>
              label="Headline lines"
              items={s.headlineLines}
              onChange={(items) => update({ headlineLines: items })}
              newItem={() => ""}
              addLabel="Add line"
              hint="Each line stacks under the previous. Three or four reads cleanest."
              renderItem={(item, idx, set) => (
                <TextField
                  label={`Line ${idx + 1}`}
                  value={item}
                  onChange={(v) => set(v)}
                />
              )}
            />
            <TextAreaField
              label="Supporting paragraph"
              value={s.supporting}
              onChange={(v) => update({ supporting: v })}
              hint="Two to three sentences below the headline."
              rows={3}
            />
          </section>

          <section className="card p-7 space-y-5">
            <h2 className="font-display text-2xl text-olive-900">Calls to action</h2>
            <CtaField
              label="Primary CTA"
              value={s.primaryCta}
              onChange={(v) => update({ primaryCta: v })}
            />
            <CtaField
              label="Secondary CTA"
              value={s.secondaryCta}
              onChange={(v) => update({ secondaryCta: v })}
            />
            <TextField
              label="Italic tagline"
              value={s.tagline}
              onChange={(v) => update({ tagline: v })}
              placeholder="Like the olive to your martini"
              hint="Renders italicised as the brand signature."
            />
          </section>

          <section className="card p-7 space-y-5">
            <h2 className="font-display text-2xl text-olive-900">Hero image</h2>
            <ImageField
              label="Primary photo"
              value={s.images.primary}
              onChange={(url) =>
                update({ images: { ...s.images, primary: url ?? "" } })
              }
              cmsKey="home.hero.primary"
              aspect="aspect-[4/5]"
            />
            <TextField
              label="Caption"
              value={s.images.caption}
              onChange={(v) =>
                update({ images: { ...s.images, caption: v } })
              }
              placeholder="Eames & Co. — Glenorchy, March 2024"
              hint="Italic credit line under the image."
            />
          </section>
        </>
      )}
    </SectionEditor>
  );
}
