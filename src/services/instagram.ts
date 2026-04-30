import "server-only";

export type InstagramMedia = {
  id: string;
  caption: string | null;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string;
  timestamp: string;
};

/**
 * Server-side Instagram Graph fetch — cached for an hour via Next's
 * native `revalidate`. Falls back to `null` if no token is configured;
 * the homepage uses placeholder imagery in that case.
 */
export async function getInstagramFeed(limit = 6): Promise<InstagramMedia[] | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId) return null;

  const url = new URL(`https://graph.instagram.com/v21.0/${userId}/media`);
  url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", token);

  try {
    const res = await fetch(url, { next: { revalidate: 3600, tags: ["instagram"] } });
    if (!res.ok) {
      console.warn("[instagram] non-200", res.status);
      return null;
    }
    const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
    if (!Array.isArray(json.data)) return null;
    return json.data.slice(0, limit).map((row) => ({
      id: String(row.id),
      caption: (row.caption as string | null) ?? null,
      mediaType: (row.media_type as InstagramMedia["mediaType"]) ?? "IMAGE",
      mediaUrl: String(row.media_url),
      thumbnailUrl: (row.thumbnail_url as string | null) ?? null,
      permalink: String(row.permalink),
      timestamp: String(row.timestamp),
    }));
  } catch (e) {
    console.warn("[instagram] fetch failed", e);
    return null;
  }
}
