import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Reads/writes auth cookies via Next's cookie store.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  type CookieToSet = { name: string; value: string; options: CookieOptions };

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `set` will throw inside RSC — that's fine, middleware refreshes cookies.
          }
        },
      },
    },
  );
}
