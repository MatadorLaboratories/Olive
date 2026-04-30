import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Supabase auth cookies on each request and applies
 * coarse-grained route protection. Fine-grained role checks happen
 * inside the layouts that need them.
 *
 * Next.js 16 renamed `middleware` to `proxy` — same runtime, new name.
 *
 * If Supabase isn't connected (env unset or placeholder), we skip the auth
 * check entirely so the site renders off seed data without 500ing on every
 * request trying to reach a non-existent instance.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const connected = !!url && !!key && !url.includes("placeholder");

  if (!connected) {
    // Demo / local-preview mode — no auth, no protected-route redirects.
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const protectedPrefixes = ["/account", "/trade", "/admin"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const u = request.nextUrl.clone();
    u.pathname = "/login";
    u.searchParams.set("next", pathname);
    return NextResponse.redirect(u);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)).*)"],
};
