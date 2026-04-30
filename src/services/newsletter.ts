"use server";

import { z } from "zod";
import { Resend } from "resend";
import type { ServerActionResult } from "./enquiries";

const subscribeSchema = z.object({
  email: z.string().email(),
});

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

/**
 * Subscribe to the studio newsletter via Resend Audiences.
 * - If no `RESEND_API_KEY` / `RESEND_AUDIENCE_ID`, returns a soft-success
 *   so the UX stays graceful in dev. The console flags the missing keys.
 */
export async function subscribeToNewsletter(formData: FormData): Promise<ServerActionResult> {
  const parsed = subscribeSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !AUDIENCE_ID) {
    console.warn("[newsletter] RESEND_API_KEY or RESEND_AUDIENCE_ID missing — subscription is a no-op");
    return { ok: true };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.contacts.create({
      email: parsed.data.email,
      audienceId: AUDIENCE_ID,
      unsubscribed: false,
    });
    return { ok: true };
  } catch (e) {
    console.error("[newsletter] subscribe failed", e);
    return { ok: false, error: "Couldn't add you to the list. Try again or email the studio directly." };
  }
}
