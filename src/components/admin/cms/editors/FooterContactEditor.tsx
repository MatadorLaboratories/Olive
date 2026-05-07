"use client";

import type { seedCms } from "@/data/seed/cms";
import { SectionEditor } from "../SectionEditor";
import { TextField } from "../fields";

type FC = (typeof seedCms)["footer.contact"];
type FCDraft = { location: string; email: string; phone: string };

export function FooterContactEditor({ initial }: { initial: FC }) {
  const draft: FCDraft = {
    location: String(initial.location ?? ""),
    email: String(initial.email ?? ""),
    phone: String(initial.phone ?? ""),
  };
  return (
    <SectionEditor<FCDraft>
      cmsKey="footer.contact"
      initial={draft}
      title={
        <>
          Footer <span className="italic font-light">contact.</span>
        </>
      }
      description="Studio location, email and phone — used in the footer block and on receipts."
      previewHref="/"
    >
      {(s, update) => (
        <section className="card p-7 space-y-5">
          <TextField
            label="Location"
            value={s.location}
            onChange={(v) => update({ location: v })}
            placeholder="Queenstown, Aotearoa New Zealand"
          />
          <TextField
            label="Contact email"
            value={s.email}
            onChange={(v) => update({ email: v })}
            placeholder="hello@olivelinen.co.nz"
          />
          <TextField
            label="Phone"
            value={s.phone}
            onChange={(v) => update({ phone: v })}
            placeholder="+64 (0)3 …"
          />
        </section>
      )}
    </SectionEditor>
  );
}
