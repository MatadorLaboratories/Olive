import "server-only";
import { Resend } from "resend";

let _resend: Resend | null = null;
function client(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set.");
  _resend = new Resend(key);
  return _resend;
}

/**
 * Email service — fronts Resend.
 * Phase 1 supports a single transactional sender; templates live in
 * `email_templates` table and are rendered server-side.
 */
export async function sendTransactional(args: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL ?? "Olive Linen <hello@olivelinen.co.nz>";
  return client().emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
  });
}
