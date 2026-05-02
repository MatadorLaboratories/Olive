import "server-only";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "../_supabase-available";

/**
 * Admin-side messaging.
 *
 * Sits next to `services/messaging.ts` (the client/vendor surface). The
 * difference: we list threads across every booking + custom order so the
 * studio has a single inbox, and we expose a `sendAdminMessage` that posts
 * with the admin user's identity (RLS still enforces sender_id = auth.uid()).
 *
 * In demo mode (no Supabase) we return a small seed conversation so the
 * inbox UI has substance.
 */

export type AdminThreadKind = "booking" | "custom_order";

export type AdminThreadSummary = {
  threadId: string;
  kind: AdminThreadKind;
  subject: string | null;
  /** Booking reference (e.g. OLV-1042) or custom-order reference. */
  reference: string | null;
  /** Free-text label of the customer side ("Charlotte Eames", "Margot Group"). */
  counterpartName: string | null;
  /** Last message preview. */
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    senderId: string;
    senderName: string | null;
    senderRole: "client" | "vendor" | "staff" | "admin";
  } | null;
  /** True if the most recent message was from the customer (we owe a reply). */
  needsReply: boolean;
  unreadCount: number;
  /** Deep link to the matching admin context page. */
  contextHref: string | null;
};

export type AdminThreadDetail = {
  threadId: string;
  kind: AdminThreadKind;
  subject: string | null;
  reference: string | null;
  counterpartName: string | null;
  contextHref: string | null;
  contextSummary: {
    eventDate?: string | null;
    venue?: string | null;
    status?: string | null;
    totalCents?: number | null;
    customerEmail?: string | null;
  } | null;
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
    senderId: string;
    senderName: string | null;
    senderRole: "client" | "vendor" | "staff" | "admin";
    attachments: string[];
  }>;
};

// =====================================================================
// Demo seed (used when Supabase isn't connected)
// =====================================================================

const seedThreads: AdminThreadSummary[] = [
  {
    threadId: "demo-thread-1",
    kind: "booking",
    subject: "Booking OLV-1042",
    reference: "OLV-1042",
    counterpartName: "Charlotte Eames",
    lastMessage: {
      id: "demo-m-2",
      body: "Wonderful, thank you. Florals will arrive at 8am — happy to coordinate handover with your driver if useful.",
      createdAt: "2026-04-22T10:02:00Z",
      senderId: "demo-client",
      senderName: "Charlotte Eames",
      senderRole: "client",
    },
    needsReply: true,
    unreadCount: 1,
    contextHref: "/admin/bookings/demo-1042",
  },
];

const seedThreadDetail: AdminThreadDetail = {
  threadId: "demo-thread-1",
  kind: "booking",
  subject: "Booking OLV-1042",
  reference: "OLV-1042",
  counterpartName: "Charlotte Eames",
  contextHref: "/admin/bookings/demo-1042",
  contextSummary: {
    eventDate: "2026-06-14",
    venue: "Glenorchy Estate",
    status: "confirmed",
    totalCents: 142000,
    customerEmail: "charlotte@eamesco.nz",
  },
  messages: [
    {
      id: "demo-m-1",
      body: "Hi Charlotte — your bone scallops have been pulled and are pressing nicely. Looking forward to Glenorchy.",
      createdAt: "2026-04-22T09:14:00Z",
      senderId: "studio",
      senderName: "The studio",
      senderRole: "admin",
      attachments: [],
    },
    {
      id: "demo-m-2",
      body: "Wonderful, thank you. Florals will arrive at 8am — happy to coordinate handover with your driver if useful.",
      createdAt: "2026-04-22T10:02:00Z",
      senderId: "demo-client",
      senderName: "Charlotte Eames",
      senderRole: "client",
      attachments: [],
    },
  ],
};

// =====================================================================
// Reads
// =====================================================================

type ProfileShape = { full_name?: string | null; role?: string | null };

type ThreadRow = {
  id: string;
  subject: string | null;
  booking_id: string | null;
  custom_order_id: string | null;
  bookings?: {
    reference: string | null;
    client_full_name: string | null;
    client_email: string | null;
    delivery_address: string | null;
    event_date: string | null;
    status: string | null;
    total_cents: number | null;
  } | null;
  custom_orders?: {
    reference: string | null;
    business_name: string | null;
    contact_name: string | null;
    contact_email: string | null;
    status: string | null;
  } | null;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  attachments: string[] | null;
  created_at: string;
  profiles?: ProfileShape | null;
};

/**
 * List every active thread, newest activity first. Booking threads first,
 * then custom-order threads.
 */
export async function getAdminThreadList(): Promise<AdminThreadSummary[]> {
  if (!supabaseAvailable()) return seedThreads;

  const admin = createSupabaseAdminClient();

  const { data: threadsData, error: threadsErr } = await admin
    .from("message_threads")
    .select(
      [
        "id",
        "subject",
        "booking_id",
        "custom_order_id",
        "bookings:booking_id(reference, client_full_name, client_email, delivery_address, event_date, status, total_cents)",
        "custom_orders:custom_order_id(reference, business_name, contact_name, contact_email, status)",
      ].join(", "),
    );

  if (threadsErr || !threadsData) {
    console.warn("[admin.messaging.getAdminThreadList] threads read failed", threadsErr);
    return [];
  }

  const threads = threadsData as unknown as ThreadRow[];
  if (threads.length === 0) return [];

  const threadIds = threads.map((t) => t.id);

  // Pull every message for these threads in one query, ordered by time.
  // We'll group + take the last per thread in JS.
  const { data: msgData } = await admin
    .from("messages")
    .select(
      "id, thread_id, sender_id, body, attachments, created_at, profiles:sender_id(full_name, role)",
    )
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  const messages = ((msgData as unknown as MessageRow[]) ?? []);
  const lastByThread = new Map<string, MessageRow>();
  const countByThread = new Map<string, number>();
  for (const m of messages) {
    if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m);
    countByThread.set(m.thread_id, (countByThread.get(m.thread_id) ?? 0) + 1);
  }

  const summaries: AdminThreadSummary[] = threads.map((t) => {
    const last = lastByThread.get(t.id) ?? null;
    const senderRole = (last?.profiles?.role as AdminThreadSummary["lastMessage"] extends infer L
      ? L extends { senderRole: infer R }
        ? R
        : never
      : never) ?? "client";

    const isBooking = !!t.booking_id;
    const reference = isBooking
      ? (t.bookings?.reference ?? null)
      : (t.custom_orders?.reference ?? null);

    const counterpartName = isBooking
      ? (t.bookings?.client_full_name ?? null)
      : (t.custom_orders?.business_name ?? t.custom_orders?.contact_name ?? null);

    const contextHref = isBooking
      ? t.booking_id
        ? `/admin/bookings/${t.booking_id}`
        : null
      : t.custom_order_id
        ? `/admin/wholesale#${t.custom_order_id}`
        : null;

    const lastFromCustomer =
      last !== null && last.profiles?.role !== "admin" && last.profiles?.role !== "staff";

    return {
      threadId: t.id,
      kind: isBooking ? "booking" : "custom_order",
      subject: t.subject,
      reference,
      counterpartName,
      lastMessage: last
        ? {
            id: last.id,
            body: last.body,
            createdAt: last.created_at,
            senderId: last.sender_id,
            senderName: last.profiles?.full_name ?? null,
            senderRole: senderRole as "client" | "vendor" | "staff" | "admin",
          }
        : null,
      needsReply: lastFromCustomer,
      unreadCount: countByThread.get(t.id) ?? 0,
      contextHref,
    };
  });

  // Sort: needsReply first, then most-recent activity.
  summaries.sort((a, b) => {
    if (a.needsReply !== b.needsReply) return a.needsReply ? -1 : 1;
    const aT = a.lastMessage?.createdAt ?? "";
    const bT = b.lastMessage?.createdAt ?? "";
    return bT.localeCompare(aT);
  });

  return summaries;
}

/**
 * Fetch one thread plus its full message list and a small context summary.
 * Returns null if the thread can't be found.
 */
export async function getAdminThreadDetail(
  threadId: string,
): Promise<AdminThreadDetail | null> {
  if (!supabaseAvailable()) {
    return threadId === seedThreadDetail.threadId ? seedThreadDetail : null;
  }

  const admin = createSupabaseAdminClient();

  const { data: threadData, error } = await admin
    .from("message_threads")
    .select(
      [
        "id",
        "subject",
        "booking_id",
        "custom_order_id",
        "bookings:booking_id(reference, client_full_name, client_email, delivery_address, event_date, status, total_cents)",
        "custom_orders:custom_order_id(reference, business_name, contact_name, contact_email, status)",
      ].join(", "),
    )
    .eq("id", threadId)
    .maybeSingle();

  if (error || !threadData) return null;

  const t = threadData as unknown as ThreadRow;
  const isBooking = !!t.booking_id;
  const reference = isBooking
    ? (t.bookings?.reference ?? null)
    : (t.custom_orders?.reference ?? null);
  const counterpartName = isBooking
    ? (t.bookings?.client_full_name ?? null)
    : (t.custom_orders?.business_name ?? t.custom_orders?.contact_name ?? null);
  const contextHref = isBooking
    ? t.booking_id
      ? `/admin/bookings/${t.booking_id}`
      : null
    : t.custom_order_id
      ? `/admin/wholesale#${t.custom_order_id}`
      : null;

  const contextSummary = isBooking
    ? {
        eventDate: t.bookings?.event_date ?? null,
        venue: t.bookings?.delivery_address ?? null,
        status: t.bookings?.status ?? null,
        totalCents: t.bookings?.total_cents ?? null,
        customerEmail: t.bookings?.client_email ?? null,
      }
    : {
        status: t.custom_orders?.status ?? null,
        customerEmail: t.custom_orders?.contact_email ?? null,
      };

  const { data: msgData } = await admin
    .from("messages")
    .select(
      "id, thread_id, sender_id, body, attachments, created_at, profiles:sender_id(full_name, role)",
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const messages = ((msgData as unknown as MessageRow[]) ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.created_at,
    senderId: m.sender_id,
    senderName: m.profiles?.full_name ?? null,
    senderRole: (m.profiles?.role ?? "client") as
      | "client"
      | "vendor"
      | "staff"
      | "admin",
    attachments: (m.attachments as string[] | null) ?? [],
  }));

  return {
    threadId: t.id,
    kind: isBooking ? "booking" : "custom_order",
    subject: t.subject,
    reference,
    counterpartName,
    contextHref,
    contextSummary,
    messages,
  };
}

// =====================================================================
// Writes
// =====================================================================

/**
 * Send a reply as the studio.
 *
 * The thread must already exist; admins reply on existing threads created
 * by the customer. Uses the regular session client so RLS enforces
 * sender_id = auth.uid().
 */
export async function sendAdminMessage(args: {
  threadId: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!args.body.trim()) return { ok: false, error: "Type a reply first." };

  if (!supabaseAvailable()) {
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to reply." };

  // RLS will gate this: only staff/admin or thread participants can
  // insert messages with their own sender_id.
  type Insert = {
    insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
  const { error } = await (supabase.from("messages") as unknown as Insert).insert({
    thread_id: args.threadId,
    sender_id: user.id,
    body: args.body.trim(),
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${args.threadId}`);
  return { ok: true };
}

/**
 * Find or create a thread for a booking. Used by the admin booking detail
 * to deep-link cleanly into /admin/messages/[threadId] without the admin
 * having to wait for the customer to start a thread.
 *
 * Returns the threadId.
 */
export async function ensureBookingThread(
  bookingId: string,
  reference: string,
): Promise<string | null> {
  if (!supabaseAvailable()) return null;

  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("message_threads")
    .select("id")
    .eq("booking_id", bookingId)
    .limit(1);

  const found = (existing as Array<{ id: string }> | null | undefined)?.[0]?.id;
  if (found) return found;

  type Insert = {
    insert: (row: Record<string, unknown>) => {
      select: (col: string) => {
        single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
  };
  const created = await (admin.from("message_threads") as unknown as Insert)
    .insert({ booking_id: bookingId, subject: `Booking ${reference}` })
    .select("id")
    .single();

  if (created.error || !created.data) return null;
  return created.data.id;
}
