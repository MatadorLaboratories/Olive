"use server";

import { sendAdminMessage } from "./messaging";

/**
 * Server action wrapper for the admin reply form. Mirrors the shape of
 * `sendMessageAction` so MessageThread can call either by prop.
 */
export async function sendAdminMessageAction(args: {
  threadId: string;
  body: string;
}) {
  return sendAdminMessage(args);
}
