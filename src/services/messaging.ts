import "server-only";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "./_supabase-available";

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string | null;
  senderRole: "client" | "vendor" | "staff" | "admin";
  body: string;
  createdAt: string;
  attachments: string[];
};

/**
 * Find or create the booking-scoped thread, then return its messages.
 * Demo mode returns a small seed conversation so the UI has substance.
 */
export async function getMessagesForBooking(bookingReference: string): Promise<Message[]> {
  if (!supabaseAvailable()) return seedConversation;

  const supabase = await createSupabaseServerClient();

  type BookingSel = {
    select: (cols: string) => {
      eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { id: string } | null }> };
    };
  };
  const { data: booking } = await (supabase.from("bookings") as unknown as BookingSel)
    .select("id")
    .eq("reference", bookingReference)
    .maybeSingle();
  if (!booking) return [];

  const { data: threads } = await supabase
    .from("message_threads")
    .select("id")
    .eq("booking_id", booking.id)
    .limit(1);

  const threadId = (threads as Array<{ id: string }> | null | undefined)?.[0]?.id;
  if (!threadId) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("id, thread_id, sender_id, body, attachments, created_at, profiles:sender_id(full_name, role)")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => {
    const profile = (row.profiles as { full_name?: string; role?: Message["senderRole"] } | null) ?? null;
    return {
      id: String(row.id),
      threadId: String(row.thread_id),
      senderId: String(row.sender_id),
      senderName: profile?.full_name ?? null,
      senderRole: profile?.role ?? "client",
      body: String(row.body),
      createdAt: String(row.created_at),
      attachments: (row.attachments as string[] | null) ?? [],
    };
  });
}

/**
 * Send a message — finds-or-creates the booking thread, inserts the message.
 * Returns the new message id on success.
 */
export async function sendMessage(args: {
  bookingReference: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!args.body.trim()) return { ok: false, error: "Type a message first." };

  if (!supabaseAvailable()) {
    // Demo: just simulate success.
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to message the studio." };

  type BookingSel = {
    select: (cols: string) => {
      eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { id: string; client_id: string | null; vendor_id: string | null } | null }> };
    };
  };
  const { data: booking } = await (supabase.from("bookings") as unknown as BookingSel)
    .select("id, client_id, vendor_id")
    .eq("reference", args.bookingReference)
    .maybeSingle();
  if (!booking) return { ok: false, error: "Booking not found." };

  // Find or create thread.
  const { data: existing } = await supabase
    .from("message_threads")
    .select("id")
    .eq("booking_id", booking.id)
    .limit(1);

  const admin = createSupabaseAdminClient();
  let threadId = (existing as Array<{ id: string }> | null | undefined)?.[0]?.id;
  if (!threadId) {
    type ThreadInsert = {
      insert: (row: Record<string, unknown>) => {
        select: (col: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> };
      };
    };
    const created = await (admin.from("message_threads") as unknown as ThreadInsert)
      .insert({ booking_id: booking.id, subject: `Booking ${args.bookingReference}` })
      .select("id")
      .single();
    if (created.error || !created.data) return { ok: false, error: "Couldn't open a thread." };
    threadId = created.data.id;
  }

  // Insert via the regular client so RLS enforces sender_id = auth.uid()
  type MessageInsert = { insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
  const { error } = await (supabase.from("messages") as unknown as MessageInsert).insert({
    thread_id: threadId,
    sender_id: user.id,
    body: args.body.trim(),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/account/bookings/${args.bookingReference}/messages`);
  return { ok: true };
}

// ----- demo seed -----
const seedConversation: Message[] = [
  {
    id: "m1",
    threadId: "t-demo",
    senderId: "studio",
    senderName: "The studio",
    senderRole: "admin",
    body: "Hi Charlotte — your bone scallops have been pulled and are pressing nicely. Looking forward to Glenorchy.",
    createdAt: "2026-04-22T09:14:00Z",
    attachments: [],
  },
  {
    id: "m2",
    threadId: "t-demo",
    senderId: "demo-client",
    senderName: "Charlotte Eames",
    senderRole: "client",
    body: "Wonderful, thank you. Florals will arrive at 8am — happy to coordinate handover with your driver if useful.",
    createdAt: "2026-04-22T10:02:00Z",
    attachments: [],
  },
  {
    id: "m3",
    threadId: "t-demo",
    senderId: "studio",
    senderName: "The studio",
    senderRole: "admin",
    body: "Perfect. We'll be there 8:30 sharp. I'll text the on-site contact 30 minutes before.",
    createdAt: "2026-04-22T10:08:00Z",
    attachments: [],
  },
];
