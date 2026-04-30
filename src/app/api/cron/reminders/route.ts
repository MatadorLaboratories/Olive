import { NextResponse, type NextRequest } from "next/server";
import { addDays, format, parseISO, subDays } from "date-fns";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTemplate } from "@/services/email-templates";
import { supabaseAvailable } from "@/services/_supabase-available";
import { site } from "@/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily reminders cron.
 *
 * Schedule (Netlify scheduled function or external cron):
 *   - 09:00 NZT every day → POST /api/cron/reminders with `Authorization: Bearer <CRON_SECRET>`
 *
 * Sends final-balance reminder emails for bookings whose `final_due_date`
 * lands in the configured ramp:  35d / 30d / 14d / 7d before event.
 *
 * Idempotency: each ramp produces a deterministic key per booking, written
 * to `tasks` so duplicate runs don't double-send.
 */

const RAMP_DAYS = [35, 30, 14, 7];

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!supabaseAvailable()) {
    return NextResponse.json({ skipped: "supabase not configured" });
  }

  const admin = createSupabaseAdminClient();
  const today = new Date();
  const todayISO = format(today, "yyyy-MM-dd");

  // Bookings with an event between `today + 7d` and `today + 35d`.
  const startWindow = format(addDays(today, 7), "yyyy-MM-dd");
  const endWindow = format(addDays(today, 35), "yyyy-MM-dd");

  const { data, error } = await admin
    .from("bookings")
    .select("id, reference, client_email, client_full_name, event_date, total_cents, deposit_paid_cents, final_paid_cents, final_due_date, status")
    .gte("event_date", startWindow)
    .lte("event_date", endWindow)
    .in("status", ["confirmed", "final_pending", "deposit_pending"]);

  if (error) {
    console.error("[cron.reminders] read failed", error);
    return NextResponse.json({ error: "read failed" }, { status: 500 });
  }

  type BookingRow = {
    id: string;
    reference: string;
    client_email: string | null;
    client_full_name: string | null;
    event_date: string;
    total_cents: number;
    deposit_paid_cents: number;
    final_paid_cents: number;
    final_due_date: string | null;
    status: string;
  };

  const bookings = (data ?? []) as unknown as BookingRow[];
  const sent: string[] = [];
  const skipped: string[] = [];

  for (const b of bookings) {
    if (!b.client_email) {
      skipped.push(`${b.reference} (no email)`);
      continue;
    }
    const outstanding = b.total_cents - b.deposit_paid_cents - b.final_paid_cents;
    if (outstanding <= 0) {
      skipped.push(`${b.reference} (paid)`);
      continue;
    }

    // Pick the ramp tier this booking matches today, if any.
    const event = parseISO(b.event_date);
    const dueDate = b.final_due_date ? parseISO(b.final_due_date) : subDays(event, 30);

    const ramp = RAMP_DAYS.find((d) => format(subDays(event, d), "yyyy-MM-dd") === todayISO);
    if (!ramp) {
      skipped.push(`${b.reference} (no ramp today)`);
      continue;
    }

    // Idempotency — task key per booking + ramp.
    const taskTitle = `Reminder sent — ${b.reference} @ ${ramp}d`;
    type TaskSel = {
      select: (cols: string) => {
        eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ data: Array<unknown> | null }> };
      };
    };
    const { data: existing } = await (admin.from("tasks") as unknown as TaskSel)
      .select("id")
      .eq("booking_id", b.id)
      .eq("title", taskTitle);
    if (existing && existing.length > 0) {
      skipped.push(`${b.reference} (already sent ${ramp}d)`);
      continue;
    }

    // Send the email via the template service. Template key per ramp tier.
    const tierKey =
      ramp >= 30
        ? "booking.final_reminder.30"
        : ramp >= 14
          ? "booking.final_reminder.14"
          : "booking.final_reminder.7";

    const fmt = (cents: number) =>
      new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(cents / 100);
    const firstName = (b.client_full_name ?? "").split(" ")[0] ?? "there";

    await sendTemplate({
      to: b.client_email,
      templateKey: tierKey,
      vars: {
        firstName,
        reference: b.reference,
        eventDate: format(event, "EEEE d MMMM"),
        outstandingAmount: fmt(outstanding),
        finalDueDate: format(dueDate, "EEEE d MMMM"),
        portalUrl: `${site.url}/account/bookings/${b.reference}`,
      },
    });

    // Record the audit task.
    type TaskInsert = { insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
    await (admin.from("tasks") as unknown as TaskInsert).insert({
      title: taskTitle,
      booking_id: b.id,
      completed_at: new Date().toISOString(),
    });

    sent.push(`${b.reference}@${ramp}d`);
  }

  return NextResponse.json({ sent, skipped, ranAt: new Date().toISOString() });
}

