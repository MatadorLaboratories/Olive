import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { site } from "@/config/site";
import { renderReceiptPdf, type ReceiptModel } from "./render-pdf";

/**
 * Receipt orchestrator.
 *
 * Hooked from the Stripe webhook the moment a `payment_intent.succeeded`
 * lands. Responsibility:
 *
 *   1. Idempotency check  — has a receipt already been rendered for this
 *      Stripe payment intent? If so, return the existing `documents` row.
 *   2. Pull context       — booking or custom_order, paying customer, line
 *      items if any, and the cumulative paid totals as of just-before this
 *      payment cleared.
 *   3. Render             — produce the PDF bytes via the pure renderer.
 *   4. Upload             — write to the private `documents` storage bucket
 *      under `receipts/{anchor_id}/{intent_id}.pdf`. The intent id in the
 *      path doubles as a backup idempotency guard at the storage layer.
 *   5. Insert document    — `kind = "receipt"`, anchor + size + mime set,
 *      then mirror the new `documents.id` back onto `payments.receipt_
 *      document_id` so the next webhook delivery is a no-op.
 *
 * Best-effort: this never throws into the webhook. Receipts are nice-to-have
 * artifacts; the canonical payment + status changes have already been
 * applied by the time we run. If anything fails we log and bail.
 */

type Anchor =
  | { kind: "booking"; bookingId: string; customOrderId?: undefined }
  | { kind: "custom_order"; bookingId?: undefined; customOrderId: string };

export type GenerateReceiptInput = {
  paymentIntentId: string;
  /** Stripe charge id, where available — feeds the "Stripe receipt" footer. */
  stripeChargeId?: string | null;
  stripeReceiptUrl?: string | null;
  amountCents: number;
  paidAtIso?: string;

  anchor: Anchor;
  orderReference: string;
  orderType: "booking" | "custom_order";
  /** "Deposit (50%)" / "Final balance" / "Pay in full" / "Deposit · 50%" — human label. */
  paymentLabel: string;

  /** What the customer is paying for — line items shown in the body. */
  lineItems: Array<{ label: string; sublabel?: string; amountCents: number }>;

  customer: { name: string; email: string | null };

  /** Order total in cents — what the customer signed up to pay overall. */
  orderTotalCents: number;
  /** Cents already paid against this order BEFORE this payment cleared. */
  previouslyPaidCents: number;
};

export async function generateAndStoreReceipt(
  input: GenerateReceiptInput,
): Promise<{ ok: true; documentId: string; created: boolean } | { ok: false; error: string }> {
  try {
    const admin = createSupabaseAdminClient();

    // ---------- 1. Idempotency: check for an existing receipt ----------
    type PaymentSel = {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: { id: string; receipt_document_id: string | null } | null;
          }>;
        };
      };
    };
    const { data: paymentRow } = await (
      admin.from("payments") as unknown as PaymentSel
    )
      .select("id, receipt_document_id")
      .eq("stripe_payment_intent", input.paymentIntentId)
      .maybeSingle();

    if (paymentRow?.receipt_document_id) {
      return { ok: true, documentId: paymentRow.receipt_document_id, created: false };
    }

    // ---------- 2. Build the model ----------
    const paidAt = input.paidAtIso ?? new Date().toISOString();
    const receiptReference = receiptRefFromIntent(input.paymentIntentId);
    const newTotalPaidCents = input.previouslyPaidCents + input.amountCents;
    const outstandingCents = Math.max(0, input.orderTotalCents - newTotalPaidCents);

    const model: ReceiptModel = {
      receiptReference,
      paidAt,
      orderReference: input.orderReference,
      orderType:
        input.orderType === "booking" ? "Linen hire" : "Custom napkin order",
      paymentLabel: input.paymentLabel,
      paymentMethod: "Stripe — card",
      amountPaidCents: input.amountCents,
      previouslyPaidCents: input.previouslyPaidCents,
      orderTotalCents: input.orderTotalCents,
      outstandingCents,
      customer: input.customer,
      lineItems: input.lineItems,
      stripeReceiptUrl: input.stripeReceiptUrl ?? null,
      studio: {
        name: site.name,
        location: site.location,
        email: site.contactEmail,
        phone: site.phone,
        url: site.url,
      },
    };

    // ---------- 3. Render ----------
    const logoBytes = await loadLogo();
    const pdfBytes = await renderReceiptPdf(model, logoBytes);

    // ---------- 4. Upload ----------
    const anchorId =
      input.anchor.kind === "booking"
        ? input.anchor.bookingId
        : input.anchor.customOrderId;
    const storagePath = `receipts/${anchorId}/${input.paymentIntentId}.pdf`;

    const { error: uploadError } = await admin.storage
      .from("documents")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
        cacheControl: "private, max-age=0",
      });
    if (uploadError) {
      console.error("[receipts] upload failed", uploadError);
      return { ok: false, error: uploadError.message };
    }

    // ---------- 5. Insert document row + link back to payments ----------
    const documentName = `Receipt — ${input.orderReference} · ${input.paymentLabel}`;
    type DocInsert = {
      insert: (row: Record<string, unknown>) => {
        select: (cols: string) => {
          single: () => Promise<{
            data: { id: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    const { data: insertedDoc, error: insertError } = await (
      admin.from("documents") as unknown as DocInsert
    )
      .insert({
        booking_id: input.anchor.kind === "booking" ? input.anchor.bookingId : null,
        custom_order_id:
          input.anchor.kind === "custom_order" ? input.anchor.customOrderId : null,
        kind: "receipt",
        name: documentName,
        storage_path: storagePath,
        size_bytes: pdfBytes.byteLength,
        mime_type: "application/pdf",
      })
      .select("id")
      .single();

    if (insertError || !insertedDoc) {
      console.error("[receipts] document insert failed", insertError);
      return {
        ok: false,
        error: insertError?.message ?? "Document insert failed",
      };
    }

    // Mirror the doc id back onto the payment row so future webhook
    // deliveries short-circuit on the idempotency check above.
    if (paymentRow?.id) {
      type PaymentUpdate = {
        update: (row: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      };
      await (admin.from("payments") as unknown as PaymentUpdate)
        .update({ receipt_document_id: insertedDoc.id })
        .eq("id", paymentRow.id);
    }

    return { ok: true, documentId: insertedDoc.id, created: true };
  } catch (e) {
    console.error("[receipts] orchestrator threw", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------- helpers ----------

/**
 * Receipt reference derived from the Stripe intent id — short, stable,
 * unique per receipt. We slice the last 8 hex chars of the `pi_` id and
 * uppercase. Example: `pi_3PtZxL2mABCDEF12abCD3xy7` → `OL-RCT-D3XY7ABC`.
 *
 * Stable means: regenerating the receipt for the same intent yields the
 * same reference, so customers don't see drift across re-deliveries.
 */
function receiptRefFromIntent(intentId: string): string {
  const tail = intentId.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase();
  return `OL-RCT-${tail || "RECEIPT"}`;
}

/**
 * Read /public/logo.png from disk at request time. We could cache the
 * bytes in module scope after the first read, but the file is ~tens of KB
 * and reads come in webhook spikes that aren't latency-critical. Fail-soft:
 * the renderer falls back to a text wordmark if no bytes are returned.
 */
let _logoCache: Uint8Array | undefined;
async function loadLogo(): Promise<Uint8Array | undefined> {
  if (_logoCache) return _logoCache;
  try {
    const buf = await fs.readFile(path.join(process.cwd(), "public", "logo.png"));
    _logoCache = new Uint8Array(buf);
    return _logoCache;
  } catch (e) {
    console.warn("[receipts] logo read failed (using text mark)", e);
    return undefined;
  }
}
