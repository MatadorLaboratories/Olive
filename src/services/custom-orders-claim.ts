import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseAvailable } from "./_supabase-available";

/**
 * Anonymous → logged-in handoff for custom-orders.
 *
 * The hospitality builder accepts anonymous submissions — the row goes in
 * with `customer_id = null` and the typed `contact_email`. When the
 * customer later signs in (or signs up) with a matching email, we link
 * those orders to their auth user so RLS exposes them under
 * `/account/custom-orders/...` and the pay flow works normally.
 *
 * Idempotent: re-running on a session where everything is already linked
 * is a no-op. The helper short-circuits when there's nothing to claim
 * (returns `claimed: 0`) so it's cheap to call from the account layout on
 * every nav.
 *
 * Uses the admin client because under RLS an authenticated user can only
 * UPDATE their *own* `custom_orders` row, and these rows currently have
 * `customer_id = null` — so the user has no path to claim them via their
 * own client. The admin client is safely bounded: we only ever flip
 * `customer_id` to `auth.uid()` on rows whose `contact_email` matches the
 * authenticated user's verified email.
 */
export async function claimCustomOrdersForCurrentUser(): Promise<{
  claimed: number;
}> {
  if (!supabaseAvailable()) return { claimed: 0 };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { claimed: 0 };

  const admin = createSupabaseAdminClient();

  // Read pending matches first so we can return an honest count and avoid
  // a no-op UPDATE round-trip when there's nothing to do. This also makes
  // the call observable in logs.
  type Sel = {
    select: (cols: string) => {
      is: (col: string, val: null) => {
        eq: (col: string, val: string) => Promise<{
          data: Array<{ id: string }> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
  const { data: pending } = await (admin.from("custom_orders") as unknown as Sel)
    .select("id")
    .is("customer_id", null)
    .eq("contact_email", user.email);

  if (!pending || pending.length === 0) return { claimed: 0 };

  type Update = {
    update: (row: Record<string, unknown>) => {
      is: (col: string, val: null) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };

  const { error } = await (admin.from("custom_orders") as unknown as Update)
    .update({ customer_id: user.id })
    .is("customer_id", null)
    .eq("contact_email", user.email);

  if (error) {
    console.error("[customOrdersClaim] update failed", error);
    return { claimed: 0 };
  }

  return { claimed: pending.length };
}
