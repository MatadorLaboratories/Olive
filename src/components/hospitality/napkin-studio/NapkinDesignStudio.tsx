"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useTransition } from "react";
import { HexColorPicker } from "react-colorful";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  ImagePlus,
  Italic,
  Loader2,
  Type,
  Trash2,
  Upload,
  Bold,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  NAPKIN_FONTS,
  type DesignElement,
  type ImageElement,
  type NapkinDesign,
  type TextElement,
  newImageElement,
  newTextElement,
} from "@/services/napkin-design";
import { uploadNapkinAsset } from "@/services/napkin-studio-uploads";
import type { BuilderOptions } from "@/components/hospitality/HospitalityBuilder";
import type { NapkinCanvasHandle } from "./NapkinCanvas";

// Dynamically import the Konva canvas — Konva needs `window`.
const NapkinCanvas = dynamic(
  () => import("./NapkinCanvas").then((m) => m.NapkinCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-full max-w-[680px] grid place-items-center bg-cream-50 border border-[color:var(--border-soft)] rounded-md">
        <Loader2 className="h-5 w-5 text-olive-700 animate-spin" />
      </div>
    ),
  },
);

/**
 * The customer-facing napkin design studio — Konva-backed canvas plus
 * side panels for base settings (left) and selected-element controls
 * (right). Renders fonts via Google Fonts injected at mount, so text
 * elements look correct in both the canvas and the flattened snapshot.
 *
 * Receives the design state and a setter from the parent (the hospitality
 * builder), so the design persists across step transitions and can be
 * submitted alongside the rest of the order.
 */
export const NapkinDesignStudio = forwardableStudio();

function forwardableStudio() {
  return function NapkinDesignStudioImpl({
    design,
    onChange,
    options,
    sessionToken,
    canvasRef,
  }: {
    design: NapkinDesign;
    onChange: (next: NapkinDesign) => void;
    options: BuilderOptions;
    sessionToken: string;
    /** Forwarded ref so the parent can grab a snapshot at submit time. */
    canvasRef: React.MutableRefObject<NapkinCanvasHandle | null>;
  }) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, startUpload] = useTransition();
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Responsive canvas — measure the middle column and pass the available
    // width to Konva. Default to 680 (the design grid resolution) but
    // shrink if the column is narrower so the Stage never overflows or
    // pushes the right inspector below.
    const middleRef = useRef<HTMLDivElement>(null);
    const [canvasWidth, setCanvasWidth] = useState<number>(680);
    useEffect(() => {
      const el = middleRef.current;
      if (!el) return;
      const measure = () => {
        // Subtract the card's interior padding (p-6 = 24px each side).
        const inner = el.clientWidth - 48;
        const next = Math.max(320, Math.min(720, inner));
        setCanvasWidth(next);
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    // Inject Google Fonts for the studio's curated ramp. Only the families
    // we expose to the customer are loaded — keeps the page light.
    useEffect(() => {
      const id = "napkin-studio-fonts";
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap";
      document.head.appendChild(link);
    }, []);

    // ----- selected element accessors -----
    const selected = design.elements.find((e) => e.id === selectedId) ?? null;

    // Keyboard delete
    useEffect(() => {
      if (!selectedId) return;
      const onKey = (e: KeyboardEvent) => {
        if ((e.key === "Backspace" || e.key === "Delete") && !isEditingTextField(e)) {
          e.preventDefault();
          removeElement(selectedId);
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, design]);

    // ----- mutators -----
    const updateBase = (patch: Partial<NapkinDesign["base"]>) =>
      onChange({ ...design, base: { ...design.base, ...patch } });

    const addElement = (el: DesignElement) =>
      onChange({
        ...design,
        elements: [...design.elements, { ...el, zIndex: maxZ(design) + 1 }],
      });

    const updateElement = (id: string, patch: Partial<DesignElement>) =>
      onChange({
        ...design,
        elements: design.elements.map((e) =>
          e.id === id ? ({ ...e, ...patch } as DesignElement) : e,
        ),
      });

    const removeElement = (id: string) => {
      onChange({ ...design, elements: design.elements.filter((e) => e.id !== id) });
      setSelectedId(null);
    };

    const duplicateElement = (id: string) => {
      const el = design.elements.find((e) => e.id === id);
      if (!el) return;
      const copy = {
        ...el,
        id: `${el.id}-copy-${Date.now().toString(36)}`,
        x: el.x + 24,
        y: el.y + 24,
        zIndex: maxZ(design) + 1,
      } as DesignElement;
      onChange({ ...design, elements: [...design.elements, copy] });
      setSelectedId(copy.id);
    };

    const bringForward = (id: string) => {
      const el = design.elements.find((e) => e.id === id);
      if (!el) return;
      updateElement(id, { zIndex: maxZ(design) + 1 });
    };
    const sendBackward = (id: string) => {
      const el = design.elements.find((e) => e.id === id);
      if (!el) return;
      updateElement(id, { zIndex: minZ(design) - 1 });
    };

    // ----- image upload -----
    const handleAddImage = () => fileInputRef.current?.click();
    const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setUploadError(null);
      const fd = new FormData();
      fd.set("file", file);
      startUpload(async () => {
        const result = await uploadNapkinAsset(fd, sessionToken);
        if (!result.ok) {
          setUploadError(result.error);
          return;
        }
        const el = newImageElement({ url: result.url, storagePath: result.storagePath });
        addElement(el);
        setSelectedId(el.id);
      });
    };

    // ----- add text -----
    const handleAddText = () => {
      const el = newTextElement({ text: "Your text" });
      addElement(el);
      setSelectedId(el.id);
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_280px] gap-6">
        {/* Left side panel — base settings */}
        <aside className="space-y-5 lg:order-1 order-2">
          <div className="card p-5">
            <p className="eyebrow text-clay-500 mb-3">Napkin · base</p>
            <ColourSection
              label="Fabric colour"
              value={design.base.fillColor}
              swatches={options.colours}
              onChange={(hex) => updateBase({ fillColor: hex })}
            />
            <div className="mt-4">
              <ColourSection
                label="Edge colour"
                value={design.base.edgeColor}
                swatches={options.colours}
                onChange={(hex) => updateBase({ edgeColor: hex })}
              />
            </div>
            <div className="mt-4">
              <p className="field-label">Edge style</p>
              <div className="grid grid-cols-2 gap-2">
                {options.edges.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => updateBase({ edge: e.id })}
                    className={cn(
                      "text-[12px] uppercase tracking-[0.14em] px-3 py-2 rounded-md border transition-colors",
                      design.base.edge === e.id
                        ? "border-olive-900 bg-cream-50 text-olive-900"
                        : "border-[color:var(--color-rule)] text-olive-700 hover:border-olive-700",
                    )}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toolbar block */}
          <div className="card p-5 space-y-3">
            <p className="eyebrow text-clay-500 mb-1">Add to napkin</p>
            <button
              type="button"
              onClick={handleAddText}
              className="btn btn-secondary !py-2.5 !text-[12px] w-full"
            >
              <Type className="h-3.5 w-3.5" strokeWidth={1.5} />
              Add text
            </button>
            <button
              type="button"
              onClick={handleAddImage}
              disabled={uploading}
              className={cn("btn btn-secondary !py-2.5 !text-[12px] w-full", uploading && "opacity-70")}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              Upload logo / artwork
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={onPickFile}
              className="sr-only"
            />
            {uploadError && (
              <p className="text-[12px] text-clay-600 italic">{uploadError}</p>
            )}
          </div>

          {/* Layers list */}
          {design.elements.length > 0 && (
            <div className="card p-5">
              <p className="eyebrow text-clay-500 mb-3">Layers</p>
              <ul className="space-y-1.5">
                {[...design.elements]
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((el) => (
                    <li key={el.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(el.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-[12px] flex items-center gap-2 border transition-colors",
                          selectedId === el.id
                            ? "border-olive-900 bg-cream-50 text-olive-900"
                            : "border-transparent text-olive-700 hover:bg-cream-50",
                        )}
                      >
                        {el.type === "text" ? (
                          <Type className="h-3 w-3" strokeWidth={1.5} />
                        ) : (
                          <ImagePlus className="h-3 w-3" strokeWidth={1.5} />
                        )}
                        <span className="truncate">
                          {el.type === "text" ? el.text || "Text" : "Image"}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Canvas — middle */}
        <div ref={middleRef} className="lg:order-2 order-1 min-w-0">
          <div className="card p-6 grid place-items-center bg-[color:var(--color-linen)]">
            <div className="w-full" style={{ maxWidth: canvasWidth }}>
              <NapkinCanvas
                ref={canvasRef}
                design={design}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onChangeElement={updateElement}
                displayWidth={canvasWidth}
              />
            </div>
            <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-olive-500 text-center">
              Click anywhere outside an element to deselect · drag corners to resize
            </p>
          </div>
        </div>

        {/* Right side panel — selected element controls */}
        <aside className="lg:order-3 order-3">
          {selected ? (
            <ElementInspector
              element={selected}
              onChange={(patch) => updateElement(selected.id, patch)}
              onDuplicate={() => duplicateElement(selected.id)}
              onRemove={() => removeElement(selected.id)}
              onBringForward={() => bringForward(selected.id)}
              onSendBackward={() => sendBackward(selected.id)}
            />
          ) : (
            <div className="card p-6">
              <p className="eyebrow text-clay-500 mb-2">No selection</p>
              <p className="font-display text-xl text-olive-900 italic font-light leading-tight">
                Pick an element to edit, or add one from the left.
              </p>
              <p className="mt-3 text-sm text-olive-700/85 leading-relaxed">
                Selected text and image elements show their controls here —
                font, colour, opacity, alignment, position.
              </p>
            </div>
          )}
        </aside>
      </div>
    );
  };
}

// ---------- Inspector ----------

function ElementInspector({
  element,
  onChange,
  onDuplicate,
  onRemove,
  onBringForward,
  onSendBackward,
}: {
  element: DesignElement;
  onChange: (patch: Partial<DesignElement>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}) {
  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow text-clay-500">
          {element.type === "text" ? "Text · selected" : "Image · selected"}
        </p>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]">
          <button
            type="button"
            onClick={onSendBackward}
            className="text-olive-700 hover:text-clay-600"
            title="Send backward"
          >
            ↧
          </button>
          <button
            type="button"
            onClick={onBringForward}
            className="text-olive-700 hover:text-clay-600"
            title="Bring forward"
          >
            ↥
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="text-olive-700 hover:text-clay-600 inline-flex items-center gap-1"
          >
            <Copy className="h-3 w-3" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-clay-600 hover:text-clay-700 inline-flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {element.type === "text" ? (
        <TextInspector el={element} onChange={onChange} />
      ) : (
        <ImageInspector el={element} onChange={onChange} />
      )}

      {/* Common: opacity */}
      <div>
        <label className="field-label">Opacity</label>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={element.opacity}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
          className="w-full accent-clay-500"
        />
      </div>
    </div>
  );
}

function TextInspector({
  el,
  onChange,
}: {
  el: TextElement;
  onChange: (patch: Partial<TextElement>) => void;
}) {
  return (
    <>
      <div>
        <label className="field-label">Text</label>
        <textarea
          value={el.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={2}
          className="field-textarea !text-[14px]"
        />
      </div>

      <div>
        <label className="field-label">Font</label>
        <select
          value={el.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="field-select"
        >
          {NAPKIN_FONTS.map((f) => (
            <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Size</label>
          <input
            type="number"
            value={el.fontSize}
            min={8}
            max={200}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label">Letter spacing</label>
          <input
            type="number"
            value={el.letterSpacing}
            step={0.5}
            onChange={(e) => onChange({ letterSpacing: Number(e.target.value) })}
            className="field-input"
          />
        </div>
      </div>

      <div>
        <p className="field-label">Style</p>
        <div className="flex items-center gap-2">
          <ToggleBtn
            active={el.fontWeight >= 600}
            onClick={() => onChange({ fontWeight: el.fontWeight >= 600 ? 400 : 600 })}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" strokeWidth={2} />
          </ToggleBtn>
          <ToggleBtn
            active={el.fontStyle === "italic"}
            onClick={() => onChange({ fontStyle: el.fontStyle === "italic" ? "normal" : "italic" })}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" strokeWidth={1.5} />
          </ToggleBtn>
          <span className="w-px h-6 bg-[color:var(--color-rule)] mx-1" />
          <ToggleBtn
            active={el.align === "left"}
            onClick={() => onChange({ align: "left" })}
            title="Align left"
          >
            <AlignLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          </ToggleBtn>
          <ToggleBtn
            active={el.align === "center"}
            onClick={() => onChange({ align: "center" })}
            title="Align center"
          >
            <AlignCenter className="h-3.5 w-3.5" strokeWidth={1.5} />
          </ToggleBtn>
          <ToggleBtn
            active={el.align === "right"}
            onClick={() => onChange({ align: "right" })}
            title="Align right"
          >
            <AlignRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </ToggleBtn>
        </div>
      </div>

      <ColourPickerSection
        label="Text colour"
        value={el.fill}
        onChange={(hex) => onChange({ fill: hex })}
      />
    </>
  );
}

function ImageInspector({
  el,
  onChange,
}: {
  el: ImageElement;
  onChange: (patch: Partial<ImageElement>) => void;
}) {
  return (
    <>
      <p className="text-[12px] text-olive-700">
        Drag handles to resize. Hold corner handles to keep it crisp.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Width</label>
          <input
            type="number"
            value={Math.round(el.width)}
            min={20}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label">Height</label>
          <input
            type="number"
            value={Math.round(el.height)}
            min={20}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
            className="field-input"
          />
        </div>
      </div>
    </>
  );
}

// ---------- Colour helpers ----------

function ColourSection({
  label,
  value,
  swatches,
  onChange,
}: {
  label: string;
  value: string;
  swatches: BuilderOptions["colours"];
  onChange: (hex: string) => void;
}) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {swatches.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.hex)}
            className={cn(
              "aspect-square rounded-md border transition-all",
              value.toLowerCase() === s.hex.toLowerCase()
                ? "ring-2 ring-olive-900 border-olive-900"
                : "border-[color:var(--color-rule)] hover:border-olive-700",
            )}
            style={{ background: s.hex }}
            title={s.label}
          />
        ))}
      </div>
      <ColourPickerSection value={value} onChange={onChange} compact />
    </div>
  );
}

function ColourPickerSection({
  label,
  value,
  onChange,
  compact,
}: {
  label?: string;
  value: string;
  onChange: (hex: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {label && <p className="field-label">{label}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-9 w-12 rounded-md border border-[color:var(--border-base)] cursor-pointer"
          style={{ background: value }}
          title="Pick colour"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field-input !text-[12px]"
          placeholder="#1d2616"
        />
      </div>
      {open && !compact && (
        <div className="mt-3">
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
      {open && compact && (
        <div className="mt-3 [&_.react-colorful]:!w-full [&_.react-colorful]:!h-32">
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "h-8 w-8 grid place-items-center rounded-md border transition-colors",
        active
          ? "border-olive-900 bg-cream-50 text-olive-900"
          : "border-[color:var(--color-rule)] text-olive-600 hover:border-olive-700",
      )}
    >
      {children}
    </button>
  );
}

// ---------- helpers ----------

function maxZ(d: NapkinDesign) {
  return d.elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
}
function minZ(d: NapkinDesign) {
  return d.elements.reduce((m, e) => Math.min(m, e.zIndex), 0);
}

function isEditingTextField(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || (t as HTMLElement).isContentEditable;
}
