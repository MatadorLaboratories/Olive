import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAvailable } from "./_supabase-available";
import { seedEmailTemplates, type EmailTemplate } from "@/data/seed/email-templates";
import { sendTransactional } from "./email";
import { site } from "@/config/site";

/**
 * Email template service.
 * - DB rows (`email_templates`) are the source of truth when present.
 * - Seed templates fall back when not edited or DB isn't connected.
 */

export async function getTemplate(key: string): Promise<EmailTemplate | null> {
  const fallback = seedEmailTemplates[key];
  if (!supabaseAvailable()) return fallback ?? null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_templates")
    .select("key, subject, body_md, active")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return fallback ?? null;

  type Row = { key: string; subject: string; body_md: string; active: boolean };
  const r = data as unknown as Row;
  if (!r.active) return fallback ?? null;
  return { key: r.key, subject: r.subject, bodyMd: r.body_md };
}

/**
 * Render a template — substitutes `{{var}}` tokens with values from `vars`.
 * Returns subject + html (Markdown converted to a simple HTML wrapper).
 */
export function renderTemplate(template: EmailTemplate, vars: Record<string, string>) {
  const fill = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => escapeHtml(vars[k] ?? ""));

  const subject = fill(template.subject);
  const body = fill(template.bodyMd);

  // Simple Markdown → HTML: headings (#), bold (**), paragraphs.
  const html = markdownToHtml(body);

  return {
    subject,
    html: wrapHtml(html),
  };
}

/**
 * Send a templated email. Returns true on send (or noop when Resend unset).
 */
export async function sendTemplate(args: {
  to: string;
  templateKey: string;
  vars: Record<string, string>;
}): Promise<boolean> {
  const tmpl = await getTemplate(args.templateKey);
  if (!tmpl) {
    console.warn(`[email] no template for key="${args.templateKey}"`);
    return false;
  }
  if (!process.env.RESEND_API_KEY) return false;

  const { subject, html } = renderTemplate(tmpl, args.vars);
  try {
    await sendTransactional({ to: args.to, subject, html });
    return true;
  } catch (e) {
    console.warn("[email] send failed", e);
    return false;
  }
}

// ---------- helpers ----------
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function markdownToHtml(md: string): string {
  // Very small subset: paragraphs, bold, line breaks. Good enough for transactional mail.
  return md
    .split(/\n{2,}/)
    .map((paragraph) => {
      const withBold = paragraph
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1d2616;font-family:Inter,system-ui,sans-serif">${withBold}</p>`;
    })
    .join("");
}

function wrapHtml(body: string): string {
  return `
    <div style="background:#fbf8f1;padding:32px 16px">
      <div style="max-width:560px;margin:0 auto;background:#f6f1e6;padding:32px;border-radius:6px">
        <p style="margin:0 0 24px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#677b4d;font-family:Inter,system-ui,sans-serif">
          Olive Linen — Queenstown
        </p>
        ${body}
        <p style="margin:32px 0 0;font-size:13px;color:#677b4d;font-style:italic;font-family:Georgia,serif">
          Like the olive to your martini.
        </p>
        <p style="margin:8px 0 0;font-size:11px;color:#95846a;font-family:Inter,system-ui,sans-serif">
          <a href="${site.url}" style="color:#95846a">${site.url}</a> · ${site.contactEmail}
        </p>
      </div>
    </div>
  `;
}
