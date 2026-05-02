import "server-only";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

/**
 * Editorial Olive Linen receipt — pure renderer.
 *
 * Pure means: takes a `ReceiptModel` + an optional logo PNG buffer in, hands
 * back a PDF Uint8Array out. No Supabase, no Stripe, no DB. The orchestrator
 * (`services/receipts/index.ts`) feeds it data and persists the bytes.
 *
 * Visual posture: A4, 60pt margins, hairline rules, uppercase tracked
 * metadata labels, italic accents (Helvetica-Oblique). One page, always —
 * receipts shouldn't push the customer to a second page; the layout is
 * deliberately calm. Brand fonts (Fraunces / Inter) aren't embedded — pdf-
 * lib's standard Helvetica family carries the editorial signal cleanly
 * through letter-spacing and weight contrast without shipping TTFs.
 */

// ---------- types ----------

export type ReceiptModel = {
  receiptReference: string;
  /** ISO 8601 timestamp of payment. */
  paidAt: string;
  /** Order reference shown to the customer (e.g. `OLV-1188`). */
  orderReference: string;
  /** "Linen hire" / "Custom napkin order" — read by the customer in plain English. */
  orderType: string;
  /** "Deposit (50%)" / "Final balance" / "Pay in full" — describes this specific payment. */
  paymentLabel: string;
  /** "Stripe — card", "Stripe — bank transfer", or just "Stripe". */
  paymentMethod: string;
  amountPaidCents: number;
  /** Cents already paid against this order BEFORE this payment cleared. */
  previouslyPaidCents: number;
  /** Total quote / booking total in cents. */
  orderTotalCents: number;
  /** Outstanding balance AFTER this payment cleared. */
  outstandingCents: number;
  customer: {
    name: string;
    email: string | null;
  };
  lineItems: Array<{
    label: string;
    sublabel?: string;
    amountCents: number;
  }>;
  /** Optional URL to Stripe's hosted receipt — printed in the footer for cross-reference. */
  stripeReceiptUrl: string | null;
  /** Studio contact block — defaults to site config. */
  studio: {
    name: string;
    location: string;
    email: string;
    phone: string;
    url: string;
  };
};

// ---------- main ----------

/**
 * Render a receipt PDF and return its bytes.
 *
 * @param model receipt data, fully resolved by the orchestrator
 * @param logoPng optional PNG bytes for the Olive wordmark — when present
 *   the wordmark is embedded as a raster at 96pt wide, letting brand
 *   recognition survive without forcing a font embed. Without it, the
 *   word "OLIVE LINEN" is set in the display style instead.
 */
export async function renderReceiptPdf(
  model: ReceiptModel,
  logoPng?: Uint8Array,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Receipt — ${model.receiptReference}`);
  pdf.setAuthor(model.studio.name);
  pdf.setSubject(`Receipt for ${model.orderReference}`);
  pdf.setProducer("Olive Linen");
  pdf.setCreator("Olive Linen");

  const page = pdf.addPage([595.28, 841.89]); // A4 portrait
  const { width, height } = page.getSize();

  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvOblique = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // ---------- palette (matches the brand tokens) ----------
  const ink = rgb(0.114, 0.149, 0.086); // ≈ #1d2616 (olive-900)
  const olive700 = rgb(0.239, 0.294, 0.176); // ≈ #3d4b2d
  const olive500 = rgb(0.439, 0.494, 0.345); // ≈ #707e58
  const clay = rgb(0.784, 0.329, 0.11); // ≈ #c8541c
  const rule = rgb(0.176, 0.235, 0.118); // hairline tint of olive
  const ruleSoft = rgb(0.85, 0.83, 0.77); // ≈ cream-300

  // ---------- layout constants ----------
  const margin = 60;
  const contentWidth = width - margin * 2;
  let y = height - margin;

  // ---------- helpers ----------
  // Note: pdf-lib v1.17's `drawText` does not expose `characterSpacing`,
  // so we lean on uppercase + small size + olive-500 / clay color to read
  // as editorial eyebrow labels. Brand-font embedding is a follow-up.
  const drawText = (
    text: string,
    opts: {
      x: number;
      y: number;
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
    },
  ) => {
    page.drawText(text, {
      x: opts.x,
      y: opts.y,
      font: opts.font ?? helv,
      size: opts.size ?? 10,
      color: opts.color ?? ink,
    });
  };

  const eyebrow = (text: string, x: number, yPos: number, opts?: { color?: ReturnType<typeof rgb> }) => {
    drawText(text.toUpperCase(), {
      x,
      y: yPos,
      font: helvBold,
      size: 7.5,
      color: opts?.color ?? olive500,
    });
  };

  const hairline = (yPos: number, color = rule, width_ = contentWidth) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: margin + width_, y: yPos },
      thickness: 0.4,
      color,
    });
  };

  // ---------- header: wordmark / RECEIPT badge ----------

  if (logoPng) {
    try {
      const img = await pdf.embedPng(logoPng);
      // Logo aspect ≈ 245:74. Lock height to 24pt → width ~ 79.5pt.
      const logoH = 24;
      const logoW = img.width * (logoH / img.height);
      page.drawImage(img, {
        x: margin,
        y: y - logoH,
        width: logoW,
        height: logoH,
      });
    } catch {
      // Fall through to text mark if the image fails to embed.
      drawText("OLIVE LINEN", {
        x: margin,
        y: y - 12,
        font: helvBold,
        size: 12,
      });
    }
  } else {
    drawText("OLIVE LINEN", {
      x: margin,
      y: y - 12,
      font: helvBold,
      size: 12,
    });
  }

  // RECEIPT badge — top-right, right-aligned
  const eyebrowText = "RECEIPT";
  const eyebrowWidth = helvBold.widthOfTextAtSize(eyebrowText, 7.5);
  drawText(eyebrowText, {
    x: width - margin - eyebrowWidth,
    y: y - 4,
    font: helvBold,
    size: 7.5,
    color: clay,
  });
  const refSize = 16;
  const refWidth = helv.widthOfTextAtSize(model.receiptReference, refSize);
  drawText(model.receiptReference, {
    x: width - margin - refWidth,
    y: y - 22,
    font: helv,
    size: refSize,
  });

  y -= 56;
  hairline(y);
  y -= 24;

  // ---------- payment confirmed line ----------
  eyebrow("Payment confirmed", margin, y);
  y -= 14;
  drawText(formatPaidDate(model.paidAt), {
    x: margin,
    y,
    font: helvOblique,
    size: 18,
    color: ink,
  });
  y -= 36;

  // ---------- two-column meta: From / To ----------
  const colWidth = (contentWidth - 24) / 2;
  const colRightX = margin + colWidth + 24;

  const fromYStart = y;
  eyebrow("From", margin, y);
  y -= 14;
  drawText(model.studio.name, { x: margin, y, font: helv, size: 11, color: ink });
  y -= 14;
  drawText(model.studio.location, { x: margin, y, font: helv, size: 9.5, color: olive700 });
  y -= 12;
  drawText(model.studio.email, { x: margin, y, font: helv, size: 9.5, color: olive700 });
  y -= 12;
  drawText(model.studio.phone, { x: margin, y, font: helv, size: 9.5, color: olive700 });

  // Reset y to the column-start for the right column.
  let yRight = fromYStart;
  eyebrow("Billed to", colRightX, yRight);
  yRight -= 14;
  drawText(model.customer.name || "Customer", { x: colRightX, y: yRight, font: helv, size: 11 });
  yRight -= 14;
  if (model.customer.email) {
    drawText(model.customer.email, {
      x: colRightX,
      y: yRight,
      font: helv,
      size: 9.5,
      color: olive700,
    });
    yRight -= 12;
  }

  // Bring `y` to the lower of the two columns.
  y = Math.min(y, yRight) - 24;

  // ---------- order metadata strip ----------
  hairline(y, ruleSoft);
  y -= 18;

  // 4-col strip: Order ref · Order type · Payment · Method
  const stripCells = [
    { label: "Order reference", value: model.orderReference },
    { label: "Order type", value: model.orderType },
    { label: "Payment", value: model.paymentLabel },
    { label: "Method", value: model.paymentMethod },
  ];
  const cellW = contentWidth / stripCells.length;
  for (let i = 0; i < stripCells.length; i++) {
    const cell = stripCells[i]!;
    const cx = margin + cellW * i;
    eyebrow(cell.label, cx, y);
    drawText(cell.value, {
      x: cx,
      y: y - 14,
      font: helv,
      size: 10,
      color: ink,
    });
  }
  y -= 38;
  hairline(y, ruleSoft);
  y -= 24;

  // ---------- line items ----------
  eyebrow("Description", margin, y);
  eyebrow("Amount", width - margin - helv.widthOfTextAtSize("AMOUNT", 7.5) - 6 * 1.6, y);
  y -= 18;
  hairline(y, ruleSoft);
  y -= 14;

  for (const item of model.lineItems) {
    drawText(item.label, { x: margin, y, font: helv, size: 11, color: ink });
    const amount = formatMoney(item.amountCents);
    const amtW = helv.widthOfTextAtSize(amount, 11);
    drawText(amount, {
      x: width - margin - amtW,
      y,
      font: helv,
      size: 11,
      color: ink,
    });
    y -= 14;
    if (item.sublabel) {
      drawText(item.sublabel, {
        x: margin,
        y,
        font: helvOblique,
        size: 9,
        color: olive500,
      });
      y -= 12;
    }
    y -= 6;
  }
  y -= 4;
  hairline(y, ruleSoft);
  y -= 16;

  // ---------- totals block (right-aligned) ----------
  drawTotal(page, "Order total", model.orderTotalCents, y, {
    helv,
    helvBold,
    width,
    margin,
    ink,
    olive500,
    bold: false,
  });
  y -= 18;

  if (model.previouslyPaidCents > 0) {
    drawTotal(page, "Previously paid", model.previouslyPaidCents, y, {
      helv,
      helvBold,
      width,
      margin,
      ink,
      olive500,
      bold: false,
      muted: true,
    });
    y -= 18;
  }

  // Subtle rule before the headline numbers.
  page.drawLine({
    start: { x: width - margin - 220, y: y - 4 },
    end: { x: width - margin, y: y - 4 },
    thickness: 0.6,
    color: rule,
  });
  y -= 16;

  drawTotal(page, "Paid this receipt", model.amountPaidCents, y, {
    helv,
    helvBold,
    width,
    margin,
    ink,
    olive500,
    bold: true,
    accent: clay,
  });
  y -= 22;

  if (model.outstandingCents > 0) {
    drawTotal(page, "Outstanding balance", model.outstandingCents, y, {
      helv,
      helvBold,
      width,
      margin,
      ink,
      olive500,
      bold: false,
      muted: true,
    });
    y -= 18;
  } else {
    drawText("Paid in full", {
      x: width - margin - helv.widthOfTextAtSize("Paid in full", 9),
      y,
      font: helvOblique,
      size: 9,
      color: olive700,
    });
    y -= 18;
  }

  // ---------- closing message ----------
  y = Math.max(y - 28, margin + 100);
  hairline(y, ruleSoft);
  y -= 28;
  drawText("Thank you.", {
    x: margin,
    y,
    font: helvOblique,
    size: 18,
    color: ink,
  });
  y -= 18;
  drawText(closingNote(model), {
    x: margin,
    y,
    font: helv,
    size: 9.5,
    color: olive700,
  });

  // ---------- footer ----------
  const footerY = margin;
  const footerGutter = 24;
  const footerColWidth = (contentWidth - footerGutter) / 2;
  const footerRightX = margin + footerColWidth + footerGutter;
  hairline(footerY + 44, ruleSoft);
  drawText(model.studio.name, {
    x: margin,
    y: footerY + 28,
    font: helv,
    size: 9,
    color: olive700,
  });

  drawText(model.studio.location, {
    x: margin,
    y: footerY + 16,
    font: helv,
    size: 8,
    color: olive500,
  });
  drawText(fitTextToWidth(`${model.studio.email} · ${model.studio.phone}`, helv, 8, footerColWidth), {
    x: margin,
    y: footerY + 4,
    font: helv,
    size: 8,
    color: olive500,
  });

  if (model.stripeReceiptUrl) {
    const label = "Stripe receipt";
    const labelW = helv.widthOfTextAtSize(label, 8);
    drawText(label, {
      x: footerRightX + footerColWidth - labelW,
      y: footerY + 28,
      font: helv,
      size: 8,
      color: olive500,
    });

    const urlText = fitTextToWidth(model.stripeReceiptUrl, helv, 7.5, footerColWidth);
    const urlW = helv.widthOfTextAtSize(urlText, 7.5);
    drawText(urlText, {
      x: footerRightX + footerColWidth - urlW,
      y: footerY + 4,
      font: helv,
      size: 7.5,
      color: olive500,
    });
  }

  return await pdf.save();
}

// ---------- helpers ----------

function drawTotal(
  page: PDFPage,
  label: string,
  cents: number,
  yPos: number,
  ctx: {
    helv: PDFFont;
    helvBold: PDFFont;
    width: number;
    margin: number;
    ink: ReturnType<typeof rgb>;
    olive500: ReturnType<typeof rgb>;
    bold: boolean;
    accent?: ReturnType<typeof rgb>;
    muted?: boolean;
  },
) {
  const labelText = label.toUpperCase();
  const labelFont = ctx.helvBold;
  const labelSize = ctx.bold ? 9 : 8;
  const labelColor = ctx.muted ? ctx.olive500 : ctx.ink;
  page.drawText(labelText, {
    x: ctx.width - ctx.margin - 220,
    y: yPos,
    font: labelFont,
    size: labelSize,
    color: labelColor,
  });

  const value = formatMoney(cents);
  const valueFont = ctx.bold ? ctx.helvBold : ctx.helv;
  const valueSize = ctx.bold ? 18 : 11;
  const valueColor = ctx.accent ?? (ctx.muted ? ctx.olive500 : ctx.ink);
  const valueWidth = valueFont.widthOfTextAtSize(value, valueSize);
  page.drawText(value, {
    x: ctx.width - ctx.margin - valueWidth,
    y: yPos - (ctx.bold ? 4 : 0),
    font: valueFont,
    size: valueSize,
    color: valueColor,
  });
}

function formatPaidDate(iso: string): string {
  // E.g. "Sunday 2 May 2026"
  const d = new Date(iso);
  return d.toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(cents / 100);
}

function fitTextToWidth(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;

  let start = Math.max(12, Math.floor(text.length * 0.55));
  let end = Math.min(text.length - 12, Math.floor(text.length * 0.8));
  let candidate = `${text.slice(0, start)}…${text.slice(end)}`;

  while (font.widthOfTextAtSize(candidate, size) > maxWidth && end - start > 8) {
    start -= 1;
    end += 1;
    candidate = `${text.slice(0, start)}…${text.slice(end)}`;
  }

  while (font.widthOfTextAtSize(candidate, size) > maxWidth && start > 6) {
    start -= 1;
    end = Math.min(text.length, end + 1);
    candidate = `${text.slice(0, start)}…${text.slice(end)}`;
  }

  return candidate;
}

function closingNote(model: ReceiptModel): string {
  if (model.outstandingCents === 0) {
    return `Your order ${model.orderReference} is fully paid. We'll be in touch the week before despatch.`;
  }
  return `This receipt covers ${formatMoney(model.amountPaidCents)} against ${model.orderReference}. Outstanding balance ${formatMoney(model.outstandingCents)} can be paid anytime from your portal.`;
}
