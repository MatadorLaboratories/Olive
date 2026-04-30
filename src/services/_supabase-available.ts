/**
 * Returns true when env vars look populated AND the URL is not a placeholder.
 * Used by services to decide whether to query Supabase or fall back to seed.
 */
export function supabaseAvailable(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("placeholder")) return false;
  return true;
}
