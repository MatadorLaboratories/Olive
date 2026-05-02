"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { submitCustomOrder, type CustomOrderInput } from "@/services/enquiries";
import { uploadCustomBrandFile } from "@/services/custom-uploads";
import type { ComputedQuote } from "@/services/custom-order-pricing";
import { QuoteOutcome } from "./QuoteOutcome";

export type BuilderOptions = {
  fabrics: { id: string; label: string }[];
  edges: { id: string; label: string }[];
  colours: { id: string; label: string; hex: string }[];
  quantityTiers: { id: string; label: string; priceFromCents: number | null; ppuCents: number | null }[];
  customerTypes: { id: string; label: string }[];
};

type Step = 1 | 2 | 3 | 4 | 5;

type Draft = {
  customerType: string;
  fabric: string;
  edgeStyle: string;
  colour: string;
  quantityTier: string;
  quantity: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  businessName: string;
  preferredDeadline: string;
  brandNotes: string;
  paymentSetting: "quote_only" | "deposit" | "full_payment";
  logoUrl: string | null;
  inspirationUrls: string[];
};

const empty: Draft = {
  customerType: "",
  fabric: "",
  edgeStyle: "",
  colour: "",
  quantityTier: "",
  quantity: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  businessName: "",
  preferredDeadline: "",
  brandNotes: "",
  paymentSetting: "quote_only",
  logoUrl: null,
  inspirationUrls: [],
};

export function HospitalityBuilder({ options }: { options: BuilderOptions }) {
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<
    null | { reference: string; loggedIn: boolean; quote: ComputedQuote }
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Anonymous upload session — used as the path prefix in storage so files
  // from the same builder session group together when admin reviews them.
  const sessionToken = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s${Date.now()}`,
  );

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const tier = options.quantityTiers.find((t) => t.id === draft.quantityTier);
  const qty = Number.parseInt(draft.quantity || "0", 10);
  const indicativePrice = useMemo(() => {
    if (!tier) return null;
    if (tier.ppuCents && qty > 0) return tier.ppuCents * qty;
    if (tier.priceFromCents) return tier.priceFromCents;
    return null;
  }, [tier, qty]);

  // ----- step gating -----
  const canAdvance: Record<Step, boolean> = {
    1: !!draft.customerType,
    2: !!draft.fabric && !!draft.edgeStyle && !!draft.colour,
    3: !!draft.quantityTier,
    4: !!draft.contactName && /\S+@\S+\.\S+/.test(draft.contactEmail),
    5: true,
  };

  const next = () => setStep((s) => (Math.min(5, s + 1) as Step));
  const back = () => setStep((s) => (Math.max(1, s - 1) as Step));

  const submit = () => {
    setSubmitError(null);
    const payload: CustomOrderInput = {
      customerType: draft.customerType,
      businessName: draft.businessName || null,
      contactName: draft.contactName,
      contactEmail: draft.contactEmail,
      contactPhone: draft.contactPhone || null,
      fabric: draft.fabric,
      edgeStyle: draft.edgeStyle,
      colour: draft.colour,
      quantityTier: draft.quantityTier,
      quantity: qty > 0 ? qty : null,
      preferredDeadline: draft.preferredDeadline || null,
      brandNotes: draft.brandNotes || null,
      paymentSetting: draft.paymentSetting,
      logoUrl: draft.logoUrl,
      inspirationUrls: draft.inspirationUrls,
    };
    startTransition(async () => {
      const result = await submitCustomOrder(payload);
      if (!result.ok) {
        setSubmitError(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
        return;
      }
      if (!result.data) return;
      setSubmitted(result.data);
    });
  };

  if (submitted) {
    const buildSummary = [
      { label: "Customer", value: labelFor(options.customerTypes, draft.customerType) },
      { label: "Fabric", value: labelFor(options.fabrics, draft.fabric) },
      { label: "Edge", value: labelFor(options.edges, draft.edgeStyle) },
      { label: "Colour", value: labelFor(options.colours, draft.colour) },
      { label: "Tier", value: labelFor(options.quantityTiers, draft.quantityTier) },
    ];
    if (qty > 0) buildSummary.push({ label: "Quantity", value: `${qty} pcs` });
    if (draft.preferredDeadline)
      buildSummary.push({ label: "Deadline", value: draft.preferredDeadline });

    return (
      <QuoteOutcome
        reference={submitted.reference}
        loggedIn={submitted.loggedIn}
        contactName={draft.contactName}
        contactEmail={draft.contactEmail}
        quote={submitted.quote}
        buildSummary={buildSummary}
      />
    );
  }

  return (
    <section className="bg-canvas pb-32">
      <div className="shell">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Step body */}
          <div className="lg:col-span-8">
            <Stepper step={step} />

            {step === 1 && (
              <StepShell title="Tell us a little about you" stepLabel="Step 01 / Who">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.customerTypes.map((c) => (
                    <Pickable
                      key={c.id}
                      label={c.label}
                      selected={draft.customerType === c.id}
                      onClick={() => set("customerType", c.id)}
                    />
                  ))}
                </div>
              </StepShell>
            )}

            {step === 2 && (
              <StepShell title="Choose fabric, edge & colour" stepLabel="Step 02 / Fabric">
                <SectionLabel>Fabric</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.fabrics.map((f) => (
                    <Pickable key={f.id} label={f.label} selected={draft.fabric === f.id} onClick={() => set("fabric", f.id)} />
                  ))}
                </div>

                <SectionLabel>Edge</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.edges.map((e) => (
                    <Pickable key={e.id} label={e.label} selected={draft.edgeStyle === e.id} onClick={() => set("edgeStyle", e.id)} />
                  ))}
                </div>

                <SectionLabel>Colour</SectionLabel>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {options.colours.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => set("colour", c.id)}
                      className={cn(
                        "group flex flex-col items-start gap-3 rounded-md border p-4 transition-all text-left",
                        draft.colour === c.id
                          ? "border-olive-900 bg-cream-50"
                          : "border-[color:var(--color-rule)] hover:border-olive-700",
                      )}
                    >
                      <span
                        aria-hidden
                        className="block h-12 w-12 rounded-full ring-1 ring-[color:var(--color-rule)]"
                        style={{ background: c.hex }}
                      />
                      <span className="text-[12px] uppercase tracking-[0.12em] text-olive-800">{c.label}</span>
                    </button>
                  ))}
                </div>
              </StepShell>
            )}

            {step === 3 && (
              <StepShell title="How many?" stepLabel="Step 03 / Quantity">
                <div className="space-y-3">
                  {options.quantityTiers.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set("quantityTier", t.id)}
                      className={cn(
                        "w-full flex items-center justify-between gap-4 rounded-md border p-5 transition-colors text-left",
                        draft.quantityTier === t.id
                          ? "border-olive-900 bg-cream-50"
                          : "border-[color:var(--color-rule)] hover:border-olive-700",
                      )}
                    >
                      <div>
                        <p className="font-display text-xl text-olive-900">{t.label}</p>
                        {t.ppuCents && (
                          <p className="text-[12px] uppercase tracking-[0.12em] text-olive-500 mt-1">
                            From {formatMoney(t.ppuCents)} per piece
                          </p>
                        )}
                      </div>
                      {t.priceFromCents && (
                        <p className="font-display text-2xl text-olive-900 tabular">
                          From {formatMoney(t.priceFromCents)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>

                {tier?.ppuCents && (
                  <div className="mt-6 max-w-sm">
                    <label className="field-label">Approx quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={draft.quantity}
                      onChange={(e) => set("quantity", e.target.value)}
                      className="field-input"
                      placeholder="e.g. 240"
                    />
                  </div>
                )}
              </StepShell>
            )}

            {step === 4 && (
              <StepShell title="Your details" stepLabel="Step 04 / Contact">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Your name" required value={draft.contactName} onChange={(v) => set("contactName", v)} error={errors.contactName} />
                  <Field label="Business name" value={draft.businessName} onChange={(v) => set("businessName", v)} />
                  <Field label="Email" type="email" required value={draft.contactEmail} onChange={(v) => set("contactEmail", v)} error={errors.contactEmail} />
                  <Field label="Phone" type="tel" value={draft.contactPhone} onChange={(v) => set("contactPhone", v)} />
                  <Field label="Preferred deadline" type="date" value={draft.preferredDeadline} onChange={(v) => set("preferredDeadline", v)} />
                </div>

                <div className="mt-5">
                  <label className="field-label">Notes for the studio</label>
                  <textarea
                    rows={4}
                    value={draft.brandNotes}
                    onChange={(e) => set("brandNotes", e.target.value)}
                    placeholder="Logo direction, brand colours, references — anything that helps us quote well."
                    className="field-textarea"
                  />
                </div>

                {/* Brand uploads */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FileSlot
                    label="Logo"
                    description="Vector preferred — SVG or PDF. PNG/JPG also fine."
                    sessionToken={sessionToken.current}
                    kind="logo"
                    current={draft.logoUrl}
                    onChange={(url) => set("logoUrl", url)}
                  />
                  <FileSlot
                    label="Inspiration"
                    description="A reference image or two — palette, finish, vibe."
                    sessionToken={sessionToken.current}
                    kind="inspiration"
                    multiple
                    currentMany={draft.inspirationUrls}
                    onAdd={(url) =>
                      setDraft((d) => ({ ...d, inspirationUrls: [...d.inspirationUrls, url] }))
                    }
                  />
                </div>

                <div className="mt-8">
                  <p className="eyebrow text-olive-600 mb-3">How would you like to proceed?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "quote_only", label: "Quote only", body: "We'll come back with a written quote." },
                      { id: "deposit", label: "Pay 50% deposit", body: "Lock the slot, we invoice the balance later." },
                      { id: "full_payment", label: "Pay in full", body: "Quote already approved — proceed to invoice." },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => set("paymentSetting", opt.id as Draft["paymentSetting"])}
                        className={cn(
                          "rounded-md border p-4 text-left transition-colors",
                          draft.paymentSetting === opt.id
                            ? "border-olive-900 bg-cream-50"
                            : "border-[color:var(--color-rule)] hover:border-olive-700",
                        )}
                      >
                        <p className="font-display text-lg text-olive-900">{opt.label}</p>
                        <p className="text-xs text-olive-600 mt-1 leading-snug">{opt.body}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </StepShell>
            )}

            {step === 5 && (
              <StepShell title="Send it" stepLabel="Step 05 / Review">
                <p className="text-olive-800/85 leading-relaxed text-lg max-w-xl">
                  We'll come back to you within one business day. Most custom orders quote inside three days.
                </p>

                <ul className="mt-8 space-y-3 text-olive-800">
                  <ReviewLine label="Customer" value={labelFor(options.customerTypes, draft.customerType)} />
                  <ReviewLine label="Fabric" value={labelFor(options.fabrics, draft.fabric)} />
                  <ReviewLine label="Edge" value={labelFor(options.edges, draft.edgeStyle)} />
                  <ReviewLine label="Colour" value={labelFor(options.colours, draft.colour)} />
                  <ReviewLine label="Quantity tier" value={labelFor(options.quantityTiers, draft.quantityTier)} />
                  {qty > 0 && <ReviewLine label="Quantity" value={String(qty)} />}
                  <ReviewLine label="Contact" value={`${draft.contactName} — ${draft.contactEmail}`} />
                  {indicativePrice && (
                    <ReviewLine label="Indicative" value={formatMoney(indicativePrice)} accent />
                  )}
                </ul>

                {submitError && (
                  <p className="mt-6 text-sm text-clay-600 italic">{submitError}</p>
                )}
              </StepShell>
            )}

            {/* Step controls */}
            <div className="mt-10 flex items-center gap-3">
              {step > 1 && (
                <button type="button" onClick={back} className="btn btn-ghost">
                  Back
                </button>
              )}
              {step < 5 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canAdvance[step]}
                  className={cn("btn", !canAdvance[step] && "opacity-40 cursor-not-allowed")}
                >
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending}
                  className={cn("btn", pending && "opacity-70")}
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" strokeWidth={1.5} />}
                  Send to studio
                </button>
              )}
            </div>
          </div>

          {/* Live summary card — sticky on desktop */}
          <aside className="lg:col-span-4 lg:sticky lg:top-32 self-start">
            <div className="card p-7">
              <p className="eyebrow text-clay-500 mb-4">Your custom napkin</p>
              <dl className="space-y-3 text-sm">
                <SummaryLine label="Customer" value={labelFor(options.customerTypes, draft.customerType)} />
                <SummaryLine label="Fabric" value={labelFor(options.fabrics, draft.fabric)} />
                <SummaryLine label="Edge" value={labelFor(options.edges, draft.edgeStyle)} />
                <SummaryLine label="Colour" value={labelFor(options.colours, draft.colour)} colourHex={options.colours.find((c) => c.id === draft.colour)?.hex} />
                <SummaryLine label="Tier" value={labelFor(options.quantityTiers, draft.quantityTier)} />
                {qty > 0 && <SummaryLine label="Quantity" value={String(qty)} />}
              </dl>
              {indicativePrice ? (
                <div className="mt-7 pt-5 border-t border-[color:var(--color-rule-soft)]">
                  <p className="eyebrow text-olive-600">Indicative</p>
                  <p className="mt-2 font-display text-3xl text-olive-900 tabular">{formatMoney(indicativePrice)}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-olive-500">Includes plain-mitred & tier pricing. Custom edges & embroidery quoted separately.</p>
                </div>
              ) : (
                <p className="mt-6 text-sm italic text-olive-600">Pricing appears as you make selections.</p>
              )}
            </div>

            <div className="mt-6 text-center">
              <Link href="/hospitality" className="text-[12px] uppercase tracking-[0.12em] text-olive-700 hover:text-clay-500">
                Save & exit
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

// ---------- helpers ----------
function labelFor<T extends { id: string; label: string }>(opts: T[], id: string) {
  return opts.find((o) => o.id === id)?.label ?? "—";
}

function Stepper({ step }: { step: Step }) {
  return (
    <ol className="flex items-center gap-2 mb-10 text-[11px] uppercase tracking-[0.14em]">
      {[1, 2, 3, 4, 5].map((n) => (
        <li key={n} className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5",
              n < step && "border-olive-300 text-olive-700",
              n === step && "bg-olive-900 text-cream-50 border-olive-900",
              n > step && "border-[color:var(--color-rule)] text-olive-500",
            )}
          >
            <span className="font-display italic tabular">0{n}</span>
          </span>
          {n < 5 && <span className="block w-3 h-px bg-[color:var(--color-rule)]" />}
        </li>
      ))}
    </ol>
  );
}

function StepShell({ children, title, stepLabel }: { children: React.ReactNode; title: string; stepLabel: string }) {
  return (
    <div>
      <p className="eyebrow mb-4">{stepLabel}</p>
      <h2 className="font-display text-display-md text-olive-900 leading-[1.05]">{title}</h2>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow text-olive-600 mt-8 mb-3 first:mt-0">{children}</p>;
}

function Pickable({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md border p-4 transition-colors",
        selected ? "border-olive-900 bg-cream-50" : "border-[color:var(--color-rule)] hover:border-olive-700",
      )}
    >
      <p className="font-display text-lg text-olive-900">{label}</p>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="field-label">
        {label}{required && <span className="text-clay-500"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function ReviewLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-[color:var(--color-rule-soft)] pb-2">
      <span className="eyebrow text-olive-600">{label}</span>
      <span className={cn("text-right", accent ? "font-display text-2xl text-olive-900 tabular" : "")}>{value}</span>
    </li>
  );
}

function SummaryLine({ label, value, colourHex }: { label: string; value: string; colourHex?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="eyebrow text-olive-600">{label}</dt>
      <dd className="flex items-center gap-2 text-olive-800">
        {colourHex && (
          <span className="block h-3 w-3 rounded-full ring-1 ring-[color:var(--color-rule)]" style={{ background: colourHex }} />
        )}
        {value}
      </dd>
    </div>
  );
}

function FileSlot(props: {
  label: string;
  description: string;
  sessionToken: string;
  kind: "logo" | "inspiration";
} & (
  | { multiple?: false; current: string | null; onChange: (url: string) => void; currentMany?: never; onAdd?: never }
  | { multiple: true; currentMany: string[]; onAdd: (url: string) => void; current?: never; onChange?: never }
)) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const result = await uploadCustomBrandFile(fd, props.kind, props.sessionToken);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const url = result.signedUrl ?? result.path;
      if (props.multiple) props.onAdd(url);
      else props.onChange(url);
    });
    e.target.value = "";
  };

  const hasOne = !props.multiple && props.current;
  const items = props.multiple ? props.currentMany : [];

  return (
    <div className="rounded-md border border-[color:var(--color-rule)] p-4 bg-cream-50">
      <div className="flex items-baseline justify-between mb-1">
        <p className="font-display text-lg text-olive-900">{props.label}</p>
        {hasOne && (
          <button
            type="button"
            onClick={() => !props.multiple && props.onChange("")}
            className="text-[11px] uppercase tracking-[0.12em] text-olive-500 hover:text-clay-500 inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" strokeWidth={1.5} />
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-olive-600 leading-relaxed mb-3">{props.description}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
        onChange={onPick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className={cn("btn btn-secondary !py-2.5 !text-[12px] w-full", pending && "opacity-70")}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />}
        {hasOne ? "Replace" : items.length > 0 ? "Add another" : "Upload"}
      </button>
      {hasOne && (
        <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-olive-700 truncate">
          ✓ {(props.current ?? "").split("/").pop()}
        </p>
      )}
      {items.length > 0 && (
        <ul className="mt-3 space-y-1">
          {items.map((url, i) => (
            <li key={url} className="text-[11px] uppercase tracking-[0.12em] text-olive-700 truncate">
              ✓ {`#${i + 1}`} {url.split("/").pop()}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-3 text-xs text-clay-600 italic">{error}</p>}
    </div>
  );
}

