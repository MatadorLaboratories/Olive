# Go-live checklist

A single-page sequence to take Olive Linen from this repo to a live, transacting Netlify deploy. Estimated 90 minutes end-to-end if every account already exists.

---

## 0 · Prerequisites

- [ ] Domain ready (e.g. `olivelinen.co.nz`) with DNS access
- [ ] Studio email mailbox you'll use as the admin (e.g. `hello@olivelinen.co.nz`)
- [ ] Accounts: **Supabase**, **Stripe**, **Resend**, **Netlify**
- [ ] Local: Node ≥ 20, `supabase` CLI (`brew install supabase/tap/supabase`)

---

## 1 · Supabase project (10 min)

Current project details:

- Project name: `Olive Linen`
- Project ref: `akaxacpjrqmtwwmnecav`
- Project URL: `https://akaxacpjrqmtwwmnecav.supabase.co`
- Current region: `ap-northeast-1`

1. [x] Supabase project already created.
2. [x] Apply each migration in order:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - `supabase/migrations/0003_storage_buckets.sql`
3. [x] Seed data applied from `supabase/seed.sql`:
   - 10 products
   - 10 inventory rows
   - 4 portfolio items
   - 3 testimonials
   - 6 CMS blocks
   - 7 email templates
4. [x] Bootstrap admin email is now tracked in a migration:
   - `supabase/migrations/0004_bootstrap_admin_email.sql`
   - Current bootstrap admin: `callum@matadorlabs.co.uk`
   If this ever changes, add a new migration rather than editing production manually.
5. [ ] Project Settings → API:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never client)
6. [ ] Auth → URL Configuration → set the site URL to your future production URL (you can come back and update this).
7. [ ] (Optional but recommended) Regenerate `src/types/database.ts` from the live schema:
   ```bash
   supabase gen types typescript --project-id akaxacpjrqmtwwmnecav --schema public > src/types/database.ts
   ```
   `npm run db:types` is wired for a local Supabase stack only. After regenerating, search for `untyped(` and `as unknown as` shims and tighten them.

---

## 2 · Stripe (10 min)

1. [ ] Create / activate the account, region **New Zealand**.
2. [ ] Developers → API keys:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`
3. [ ] Developers → Webhooks → **Add endpoint**:
   - URL: `https://YOUR-DOMAIN/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - **Signing secret** → `STRIPE_WEBHOOK_SECRET`
4. [ ] Settings → Branding → upload the Olive wordmark + brand colours (`#c8541c` primary, `#1d2616` text). Affects Stripe-hosted receipts.
5. [ ] Run a single $1 test booking against Stripe test mode before flipping to live.

Local sandbox note:

- For local webhook testing, use the signing secret printed by `stripe listen`, not the Dashboard endpoint secret.
- Local setup steps live in [`docs/stripe-sandbox-setup.md`](./stripe-sandbox-setup.md).

---

## 3 · Resend (5 min)

1. [ ] Add and verify your sending domain at <https://resend.com/domains>. The DKIM/SPF/DMARC records go onto your DNS.
2. [ ] API Keys → create a key → `RESEND_API_KEY`.
3. [ ] (Optional) Create an Audience → copy ID → `RESEND_AUDIENCE_ID`. Used by the footer newsletter.
4. [ ] Set `RESEND_FROM_EMAIL="Olive Linen <hello@olivelinen.co.nz>"`.

---

## 4 · Instagram (optional, 5 min)

The homepage falls back to placeholder thumbnails without these — set them when you want the live feed.

1. [ ] Create a Meta App, link your IG Business Account, generate a long-lived Graph token.
2. [ ] `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_USER_ID`.

---

## 5 · Local smoke test (5 min)

1. [ ] Copy `.env.example` → `.env.local`, fill every key from the steps above.
2. [ ] `npm install && npm run dev`.
3. [ ] Walk the booking flow at `/hire`:
   - Pick dates → see live availability
   - Add a product → quantity stepper updates the summary
   - Sign up → ends up on Stripe Payment Element
   - Pay with `4242 4242 4242 4242` (test card)
   - Land on `/hire/confirmation`, then `/account`
4. [ ] Sign in to `/admin` and verify the dashboard, calendar, bookings detail, finance show your test booking.
5. [ ] Trigger a vendor application at `/trade/apply`, then approve it from `/admin/vendors`.

---

## 6 · Netlify deploy (10 min)

1. [ ] Push the repo to GitHub.
2. [ ] Netlify → **Add new site → Import from Git** → pick the repo.
3. [ ] Build settings auto-detect from `netlify.toml`. No changes needed.
4. [ ] Site Settings → Environment variables → paste **every** key from `.env.local` (mark `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CRON_SECRET` as scoped to **Builds + Functions**, not Deploy Previews).
5. [ ] Domain → add your custom domain → enable HTTPS.
6. [ ] Update the Stripe webhook URL to the live domain. Update the Supabase Auth site URL to match.

---

## 7 · Reminders cron (5 min)

The studio's final-balance reminders are now wired for Netlify-native scheduling.

What ships in the repo:

- `netlify/functions/reminders-schedule.ts`
- `netlify.toml` points Netlify at `netlify/functions/`
- the function runs `@hourly`, then only calls `/api/cron/reminders` when the local Auckland hour is `09`

Why it runs hourly:

- Netlify Scheduled Functions use UTC
- Auckland shifts between UTC+12 and UTC+13
- the hourly wrapper avoids DST mistakes by checking `Pacific/Auckland` at runtime

What you need to do:

1. [ ] Set `CRON_SECRET` in Netlify env with **Functions** scope.
2. [ ] Deploy to production once. Scheduled functions only run on published deploys.
3. [ ] In Netlify UI → Functions, confirm `reminders-schedule` appears with a `Scheduled` badge.
4. [ ] Click **Run now** once after launch to verify the reminders path works end-to-end.

Official references:

- [Netlify Scheduled Functions docs](https://docs.netlify.com/build/functions/scheduled-functions/)
- [Netlify function environment variables docs](https://docs.netlify.com/build/functions/environment-variables/)

**Manual smoke test for the underlying route:**

```bash
curl -X POST https://YOUR-DOMAIN/api/cron/reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

You should get a JSON response with `sent`, `skipped`, and `ranAt`.

---

## 8 · Admin bootstrap (3 min)

1. [ ] Sign up at `https://YOUR-DOMAIN/signup` with the studio email.
2. [ ] If you sign up with `callum@matadorlabs.co.uk`, you'll already be admin.
   Otherwise SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@olivelinen.co.nz';
   ```
3. [ ] `/admin` should now load. Skim every module in 30 seconds — confirm seed data appears.

---

## 9 · Content swap (variable)

The seed ships with placeholder Unsplash imagery. Once your shoot is in:

1. [ ] `/admin/cms` → edit `home.hero` and `home.brand_statement` image URLs.
2. [ ] `/admin/products/[slug]` → swap each product's hero image to your hosted URL (Supabase Storage `public-media/` bucket works perfectly — upload files, copy the public URL).
3. [ ] `/admin/cms` → swap `about.body.coverImage`.
4. [ ] Portfolio: SQL editor or Phase 5 admin form to insert real case studies into `portfolio_items`.
5. [ ] `/admin/cms` → tweak FAQs, hospitality options to match your real fabrics, edges, colours and tier pricing.

---

## 10 · Pre-launch checks (10 min)

- [ ] Lighthouse on the homepage in Chrome DevTools → 95+ across the board (desktop & mobile).
- [ ] Real wedding date booking through `/hire` end-to-end on **production Stripe** with a real card (refund afterwards).
- [ ] Verify the confirmation email arrives, looks branded, links open the portal.
- [ ] Verify the reminder cron fires once (run it manually via curl with the bearer header to test).
- [ ] Verify Xero CSV download from `/admin/finance` opens cleanly in Numbers/Excel.
- [ ] Verify the trade portal is unreachable for non-vendor accounts and visible for approved vendors.
- [ ] Set the Stripe API mode to **live** (separate keys); update Netlify env; redeploy.
- [ ] Submit `https://YOUR-DOMAIN/sitemap.xml` to Google Search Console.

---

## 11 · Day-one ops

- [ ] Add the studio's bank details to Stripe payouts.
- [ ] Pin `/admin` as a browser homepage on the studio's machines.
- [ ] Set up Stripe payment failure alerts (email or Slack).
- [ ] Set up Supabase database backups (Pro tier — daily auto-backups).
- [ ] Create a private channel / spreadsheet to record the first three bookings end-to-end as a regression test.

---

## Reference: env var matrix

| Var | Source | Required? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | your domain | yes |
| `NEXT_PUBLIC_SITE_NAME` | "Olive Linen" | optional |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase API | yes (server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | yes |
| `STRIPE_SECRET_KEY` | Stripe | yes (server-only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint | yes (server-only) |
| `RESEND_API_KEY` | Resend | yes for email |
| `RESEND_FROM_EMAIL` | "Olive Linen <…>" | yes for email |
| `RESEND_AUDIENCE_ID` | Resend Audiences | optional (newsletter) |
| `INSTAGRAM_ACCESS_TOKEN` | Meta Graph | optional |
| `INSTAGRAM_USER_ID` | Meta Graph | optional |
| `CRON_SECRET` | random string | yes for cron auth |

---

Admin bootstrap note:
The first admin email is currently tracked in `supabase/migrations/0004_bootstrap_admin_email.sql`.

## After day one

Phase 5 candidates worth scoping (all are cleanly bolt-on to the existing code):

- **Per-unit serial inventory** — extend `inventory_items` with a `linen_units` table when scale demands it
- **Stripe Customer portal** — let clients self-service refunds and saved cards
- **Xero OAuth** — direct push instead of CSV
- **Native NZ Post / GoSweetSpot** — replace the link-out buttons with real label generation
- **Realtime messages** — Supabase Realtime channel on `messages` for live chat without refresh
- **Per-block CMS editors** — replace the JSON textarea with field-level forms (homepage hero is the obvious first one)
