/**
 * Napkin design — shared types + small utilities used by both the
 * customer-side studio and the admin-side review surface.
 *
 * The design is the canonical source of truth for a custom-order's
 * visual content. It is written as `custom_orders.design_json` (jsonb)
 * with a flattened PNG snapshot at `custom_orders.design_preview_url`
 * for fast review.
 */

export type NapkinShape = "square" | "rectangle";

export type NapkinBase = {
  /** Linked to `hospitality.options.fabrics[*].id`. */
  fabric: string;
  /** Linked to `hospitality.options.edges[*].id`. */
  edge: string;
  /** Hex of the napkin field colour (e.g. #EFE8D6). */
  fillColor: string;
  /** Hex of the edge colour (separate from fill). */
  edgeColor: string;
  shape: NapkinShape;
};

/** Common transform fields every element shares. */
type ElementBase = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0..1
  zIndex: number;
  locked?: boolean;
};

export type TextElement = ElementBase & {
  type: "text";
  text: string;
  /** Family — must be one of `NAPKIN_FONTS` to render server-side. */
  fontFamily: string;
  fontSize: number;
  fontStyle: "normal" | "italic";
  fontWeight: 400 | 500 | 600 | 700;
  letterSpacing: number; // pixels
  align: "left" | "center" | "right";
  fill: string; // hex
};

export type ImageElement = ElementBase & {
  type: "image";
  /** Public URL of the asset in Supabase storage. */
  url: string;
  /** Original storage path under public-media. */
  storagePath: string;
  /** Optional intrinsic dimensions for ratio preservation on resize. */
  naturalWidth?: number;
  naturalHeight?: number;
};

export type DesignElement = TextElement | ImageElement;

export type NapkinDesign = {
  /** Schema version so we can migrate stored designs cleanly. */
  version: 1;
  /** Canvas dimensions in points — matches the studio stage size. */
  canvas: { width: number; height: number };
  base: NapkinBase;
  elements: DesignElement[];
};

// ---------- defaults ----------

export const DEFAULT_CANVAS_SIZE = 720; // 720x720 napkin field, square
export const DEFAULT_NAPKIN_PADDING = 32; // hairline inset for the printable area

export function defaultDesign(initialBase?: Partial<NapkinBase>): NapkinDesign {
  return {
    version: 1,
    canvas: { width: DEFAULT_CANVAS_SIZE, height: DEFAULT_CANVAS_SIZE },
    base: {
      fabric: "linen",
      edge: "plain",
      fillColor: "#EFE8D6",
      edgeColor: "#1d2616",
      shape: "square",
      ...initialBase,
    },
    elements: [],
  };
}

// ---------- fonts catalogue ----------

/**
 * Curated font set for the napkin studio. Keep the list small and
 * editorial — the customer needs choice but the brand needs restraint.
 * All families are loaded via `next/font/google` in `app/layout.tsx`.
 */
export const NAPKIN_FONTS: Array<{ family: string; label: string; serif: boolean }> = [
  { family: "Fraunces", label: "Fraunces", serif: true },
  { family: "Cormorant Garamond", label: "Cormorant", serif: true },
  { family: "Playfair Display", label: "Playfair", serif: true },
  { family: "EB Garamond", label: "EB Garamond", serif: true },
  { family: "Inter", label: "Inter", serif: false },
];

// ---------- ID helpers ----------

let _seq = 0;
export function newElementId(): string {
  _seq += 1;
  return `el-${Date.now().toString(36)}-${_seq.toString(36)}`;
}

// ---------- factories ----------

export function newTextElement(
  partial: Partial<TextElement> & { text: string },
): TextElement {
  return {
    id: newElementId(),
    type: "text",
    x: 200,
    y: 320,
    width: 320,
    height: 80,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    fontFamily: "Fraunces",
    fontSize: 36,
    fontStyle: "normal",
    fontWeight: 400,
    letterSpacing: 0,
    align: "center",
    fill: "#1d2616",
    ...partial,
  };
}

export function newImageElement(
  partial: Pick<ImageElement, "url" | "storagePath"> & Partial<ImageElement>,
): ImageElement {
  return {
    id: newElementId(),
    type: "image",
    x: 240,
    y: 240,
    width: 240,
    height: 240,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    ...partial,
  };
}
