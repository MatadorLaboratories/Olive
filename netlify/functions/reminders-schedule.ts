const NZ_TIME_ZONE = "Pacific/Auckland";
const TRIGGER_HOUR = "09";

function getSiteUrl() {
  return (
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    process.env.DEPLOY_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    ""
  );
}

function getNzHour(now: Date) {
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TIME_ZONE,
    hour: "2-digit",
    hour12: false,
  }).format(now);
}

export default async function remindersSchedule() {
  const now = new Date();
  const nzHour = getNzHour(now);

  // Run hourly on Netlify, but only call the app route at 09:00 Auckland time.
  if (nzHour !== TRIGGER_HOUR) {
    return Response.json({
      skipped: "outside reminder window",
      ranAt: now.toISOString(),
      nzHour,
      timeZone: NZ_TIME_ZONE,
    });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return Response.json(
      { error: "Site URL is not available in runtime env" },
      { status: 500 },
    );
  }

  const endpoint = new URL("/api/cron/reminders", siteUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  });

  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}

export const config = {
  schedule: "@hourly",
};
