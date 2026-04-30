"use server";

import { sendMessage } from "./messaging";

export async function sendMessageAction(args: {
  bookingReference: string;
  body: string;
}) {
  return sendMessage(args);
}
