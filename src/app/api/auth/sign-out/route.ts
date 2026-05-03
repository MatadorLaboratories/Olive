import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sign-out endpoint.
 *
 * We deliberately use a POST route handler instead of a server action so the
 * cookie-clearing path is direct and observable: we read the request cookies,
 * hand them to a Supabase server client whose `setAll` adapter writes the
 * delete-cookies onto a `NextResponse.redirect("/")`, and ship that response
 * back. The browser follows the 303, the cleared `sb-*` cookies land, and
 * the public marketing layout renders as anonymous.
 *
 * Why not the server action? `<form action={signOut}>` worked locally but the
 * combination of (a) RSC cookie store throwing on writes inside the layout
 * render path, and (b) `redirect("/")` flushing before the cleared cookies
 * were committed in some Netlify function deployments, made the buttons
 * silently no-op for a slice of sessions. A route handler removes both
 * variables — cookies are written onto the explicit response object before
 * the redirect ever ships.
 *
 * GET is supported so we can also expose `/api/auth/sign-out` as a plain
 * link if we ever need to (defensive — forms remain the canonical path).
 */
export async function POST(request: NextRequest) {
  return signOutAndRedirect(request);
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request);
}

async function signOutAndRedirect(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Build the response we'll ship — cookies get attached to this.
  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });

  // No Supabase configured (demo mode) — nothing to clear, just redirect.
  if (!url || !key || url.includes("placeholder")) {
    return response;
  }

  type CookieToSet = { name: string; value: string; options: CookieOptions };
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        // Mirror writes onto BOTH the request (so any subsequent server
        // code in this handler sees the new state) AND the response (so
        // the browser actually receives the deletion).
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn("[auth.sign-out] supabase signOut failed (continuing)", error);
  }

  // Defensive: explicitly expire any lingering supabase cookies the SDK
  // didn't enumerate. Belt-and-braces — costs nothing and protects against
  // multi-domain / project-key drift.
  for (const cookie of request.cookies.getAll()) {
    if (/^sb-.*-auth-token/.test(cookie.name) || cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        expires: new Date(0),
        path: "/",
      });
    }
  }

  return response;
}
