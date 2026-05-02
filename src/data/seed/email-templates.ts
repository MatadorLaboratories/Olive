/**
 * Default email templates — keyed by trigger.
 * Admin can override each row in `email_templates` table; this seed
 * is the fallback when DB isn't connected or a template hasn't been edited.
 *
 * Variables use {{handlebars}} placeholders. The `renderTemplate()` helper
 * substitutes them — no real Handlebars dependency.
 */

export type EmailTemplate = {
  key: string;
  subject: string;
  bodyMd: string;
};

export const seedEmailTemplates: Record<string, EmailTemplate> = {
  "booking.confirmation": {
    key: "booking.confirmation",
    subject: "Your booking is confirmed — {{reference}}",
    bodyMd: `Hi {{firstName}},

Your booking **{{reference}}** is confirmed. We've received your deposit of **{{depositAmount}}** and your event is locked into the studio calendar.

**Event** — {{eventDate}}
**Delivery** — {{deliveryDate}}
**Venue** — {{venue}}

Your final balance of **{{outstandingAmount}}** is due 30 days before your event. We'll send a reminder.

You can view your booking, message the studio, and upload your timeline anytime from your portal:
{{portalUrl}}

Thanks for choosing us — we're looking forward to dressing the table.

— Olive Linen
*Like the olive to your martini.*`,
  },

  "booking.final_paid": {
    key: "booking.final_paid",
    subject: "Final balance received — thank you",
    bodyMd: `Hi {{firstName}},

We've received your final payment of **{{amount}}** for booking **{{reference}}**. You're fully paid up — thank you.

We'll be in touch a few days before to confirm timings.

— Olive Linen`,
  },

  "booking.final_reminder.30": {
    key: "booking.final_reminder.30",
    subject: "Final balance — coming up · {{reference}}",
    bodyMd: `Hi {{firstName}},

A friendly note that your final balance of **{{outstandingAmount}}** for booking **{{reference}}** is due **{{finalDueDate}}** — 30 days before your event.

You can pay anytime from your portal:
{{portalUrl}}

— Olive Linen`,
  },

  "booking.final_reminder.14": {
    key: "booking.final_reminder.14",
    subject: "Final balance — two weeks out · {{reference}}",
    bodyMd: `Hi {{firstName}},

Two weeks until {{eventDate}}. Your final balance of **{{outstandingAmount}}** is overdue — please clear it from your portal as soon as you can:
{{portalUrl}}

— Olive Linen`,
  },

  "booking.final_reminder.7": {
    key: "booking.final_reminder.7",
    subject: "Final balance — this week · {{reference}}",
    bodyMd: `Hi {{firstName}},

This is your final reminder — your balance of **{{outstandingAmount}}** is owing for booking **{{reference}}**, with the event coming up on {{eventDate}}.

Pay from the portal:
{{portalUrl}}

If something has come up, please message the studio and we'll work it out.

— Olive Linen`,
  },

  "vendor.approved": {
    key: "vendor.approved",
    subject: "Your trade account is approved",
    bodyMd: `Welcome aboard, {{firstName}}.

Your trade account for **{{businessName}}** is approved. You've been set to **{{tier}}** ({{discountPct}}% off hire pricing).

Sign in anytime — your discount applies automatically when you book on behalf of a client.
{{portalUrl}}

— Olive Linen`,
  },

  "custom_order.quote_sent": {
    key: "custom_order.quote_sent",
    subject: "Your napkin quote — {{reference}}",
    bodyMd: `Hi {{firstName}},

Your custom napkin quote is ready. Total: **{{quoteTotal}}**.

Reply to this email to accept or ask any questions. Once we have the green light, we'll send a deposit invoice and start production.

— Olive Linen`,
  },

  "custom_order.deposit_received": {
    key: "custom_order.deposit_received",
    subject: "Deposit received — {{reference}}",
    bodyMd: `Hi {{firstName}},

We've received your deposit of **{{amount}}** for custom order **{{reference}}** — production is locked in.

Quote total **{{quoteTotal}}**, balance outstanding **{{outstandingAmount}}**. We'll invoice the balance once your order is ready to despatch.

You can view the order, message the studio, and pay the balance anytime from your portal:
{{portalUrl}}

— Olive Linen`,
  },

  "custom_order.fully_paid": {
    key: "custom_order.fully_paid",
    subject: "Custom order paid — {{reference}}",
    bodyMd: `Hi {{firstName}},

We've received **{{amount}}** for custom order **{{reference}}** — fully paid up. Thank you.

We'll be in touch the week before despatch with timings. You can track production from the portal anytime:
{{portalUrl}}

— Olive Linen`,
  },
};
