# Architecture

## High-level

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (RSC + Client)                    │
└──────────────────────────────────────────────────────────────────┘
            │                                       │
            ▼                                       ▼
┌─────────────────────┐                ┌─────────────────────────┐
│  Next.js (App Rtr)  │                │ Stripe.js (Payment El.) │
│  Server Components  │                └─────────────────────────┘
│  Server Actions     │
│  Route Handlers     │ ──────► /api/stripe/webhook  (Stripe → server)
└─────────────────────┘
       │     │     │
       ▼     ▼     ▼
   ┌────────────────────────────────────────────────┐
   │           Domain services                      │
   │  bookings · inventory · payments · email · cms │
   └────────────────────────────────────────────────┘
       │           │           │           │
       ▼           ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
   │Supabase│  │Supabase│  │ Stripe │  │ Resend │
   │  DB    │  │Storage │  │  API   │  │  API   │
   └────────┘  └────────┘  └────────┘  └────────┘
```

## Boundaries

- **Components** never call Supabase directly. They go through services in `src/services/*`.
- **Services** wrap a Supabase client and expose typed domain functions.
- **Server Actions** are the write boundary — services run inside them.
- **Route Handlers** (`src/app/api/*`) handle webhooks and any external POSTs.

## Auth & roles

- **Provider**: Supabase Auth (email/password + magic link).
- **Profile row**: created on signup via DB trigger `handle_new_user`.
- **Roles**: `client | vendor | staff | admin` stored on `profiles.role`.
- **Cookie refresh**: `src/middleware.ts` runs on every request.
- **Coarse routing**: middleware redirects `/account|/trade|/admin` to `/login` if no user.
- **Fine-grained role checks**: layouts call a helper that fetches the profile and 404s wrong roles.
- **DB enforcement**: every table ships with RLS; even a leaked anon key cannot read the wrong rows.

## Data write paths

| Action                             | Path                                    |
| ---------------------------------- | --------------------------------------- |
| Public enquiry form submit         | Server Action → `enquiries` (anon insert allowed by RLS) |
| Booking draft → confirmed booking  | Server Action calls `services/bookings` → inserts `bookings` + items, creates Stripe PaymentIntent → returns client secret |
| Stripe payment success             | Webhook → admin client → marks `payments`, updates booking status, fires email |
| Final-balance reminders            | Cron job (Phase 2: GitHub Actions or Supabase Edge Function) → email service |
| Admin CRUD                         | Server Actions inside `(admin)` route group, gated by role check |

## Inventory model

Aggregate-quantity per product (not per-unit serials) for v1.

```
available(product, dateRange)
  = total
    − damaged
    − lost
    − retired
    − Σ booking_items.qty for overlapping bookings in {confirmed, final_pending, final_paid, packed, delivered, deposit_pending, quoted}
```

Implemented by SQL functions `available_qty()` and `allocated_qty()` (see `0001_initial_schema.sql`).
The booking flow's product step calls `available_qty` per visible card; the booking creation step rechecks atomically.

## Booking lifecycle

```
enquiry ──► quoted ──► deposit_pending ──► confirmed ──► final_pending
                                                  │
                                                  ▼
                                              final_paid ──► packed ──► delivered ──► returned ──► completed
                                                                                                         │
                                                                       ─────────► cancelled / archived  ◄┘
```

The 30-day lock toggles `cutoff_locked = true` once `event_date - now() <= 30d`. Admin can flip `admin_override` to allow further edits.

## Money

- All amounts stored as integer **NZD cents**.
- `formatMoney(cents)` is the only display helper; it lives in `src/lib/format.ts`.
- Stripe metadata mirrors `booking_reference` and `kind` so webhook routing is dumb.

## CMS

- Database is the CMS — no third-party headless CMS.
- `cms_blocks` keyed by dotted strings (`home.hero`, `home.brand_statement`) holding JSON content.
- Marketing pages render server-side from these rows; admin module edits them.

## Hosting & runtime

- **Netlify** with the Next.js Runtime (auto-detected). `.netlify.toml` ships baseline security headers.
- **Edge runtime**: not used for v1 (Supabase admin client requires Node).
- **Image domains**: `*.supabase.co` (all live imagery — `public-media/brand/...` and `public-media/products/...`), `cdn.olivelinen.co.nz` (future). Unsplash placeholders were removed in the May 2026 photography pass; see `docs/product-photography-mapping.md`.
