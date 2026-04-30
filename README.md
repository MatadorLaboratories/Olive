# Olive Linen

> Premium linen hire — Queenstown, Aotearoa New Zealand.
> *Like the olive to your martini.*

A full-stack platform that combines a premium editorial brand site with a serious operational system underneath:

- **Public** — homepage, hire flow, shop, portfolio, hospitality / custom napkin builder, about
- **Client portal** — booking summary, payments, timeline upload, messaging, documents, history
- **Trade portal** — vendor onboarding, trade pricing, repeat bookings, spend tracking
- **Admin** — dashboard, calendar, bookings, inventory, products, pricing, finance, clients, vendors, wholesale, enquiries, reports, CMS

## Stack

| Concern        | Choice                                  |
| -------------- | --------------------------------------- |
| Framework      | Next.js 15 (App Router) + React 19      |
| Language       | TypeScript (strict)                     |
| Styling        | Tailwind CSS v4 (CSS-first tokens)      |
| Type system    | Tailwind tokens via `@theme` in CSS     |
| Database/Auth  | Supabase (Postgres + Auth + Storage)    |
| Payments       | Stripe                                  |
| Email          | Resend                                  |
| Validation     | Zod                                     |
| Forms          | React Hook Form + Zod resolver          |
| Hosting        | Netlify                                 |

See [`docs/decisions.md`](docs/decisions.md) for the rationale behind each choice.

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in Supabase, Stripe, Resend keys

# 3. Run the app
npm run dev
```

The app boots at <http://localhost:3000>.

## Local Supabase

```bash
# Start local Supabase stack (Postgres, Auth, Storage, Studio)
supabase start

# Apply migrations + seed (idempotent)
supabase db reset

# Regenerate types
npm run db:types
```

Files:

- [`supabase/migrations/`](supabase/migrations/) — schema, RLS, storage buckets
- [`supabase/seed.sql`](supabase/seed.sql) — 10 products + inventory, 4 portfolio items, 3 testimonials, 6 CMS blocks, 7 email templates. Idempotent — safe to re-run.

## Going live

End-to-end checklist from a clean Supabase project to a transacting Netlify deploy:
**[docs/go-live-checklist.md](docs/go-live-checklist.md)**

For local Stripe sandbox payments and webhook forwarding:
**[docs/stripe-sandbox-setup.md](docs/stripe-sandbox-setup.md)**

## Project structure

```
src/
├── app/                       # Next.js App Router
│   ├── (marketing)/           # public website
│   ├── (booking)/             # /hire/* flow
│   ├── (auth)/                # login, signup
│   ├── (account)/             # client portal (/account/*)
│   ├── (trade)/               # vendor portal (/trade/*)
│   ├── (admin)/               # admin operating system (/admin/*)
│   └── api/                   # route handlers (Stripe webhooks, etc.)
├── components/
│   ├── brand/                 # Wordmark, brand assets
│   ├── marketing/             # public site sections & layout
│   ├── booking/               # booking-flow shell + UI
│   ├── portal/                # shared client/trade portal shell
│   └── admin/                 # admin shell + UI
├── config/site.ts             # nav, brand strings, contact
├── lib/                       # framework-agnostic utilities
│   ├── cn.ts
│   ├── env.ts
│   ├── fonts.ts
│   ├── format.ts
│   └── supabase/              # server, browser, admin clients
├── services/                  # domain logic — bookings, inventory, payments, email
├── types/                     # database types + hand-authored domain types
└── middleware.ts              # auth-cookie refresh + route protection

supabase/
└── migrations/                # SQL — schema, RLS, storage buckets

docs/
├── architecture.md
├── schema.md
├── route-map.md
├── decisions.md
├── assumptions.md
└── implementation-plan.md
```

## Scripts

| Script            | Purpose                                |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Run dev server                         |
| `npm run build`   | Production build                       |
| `npm run start`   | Run production build locally           |
| `npm run lint`    | Lint                                   |
| `npm run type-check` | Type-check without emit             |
| `npm run format`  | Prettier write                         |
| `npm run db:types` | Generate Supabase types               |

## Deployment

- **Hosting**: Netlify (config in [`netlify.toml`](netlify.toml))
- **Branch protection**: main → production. Feature branches deploy as previews.
- **Env vars**: configure the same keys from `.env.example` in Netlify project settings.
- **Stripe webhook**: point to `https://<your-domain>/api/stripe/webhook`.
- **Scheduled reminders**: native Netlify Scheduled Function in [`netlify/functions/reminders-schedule.ts`](netlify/functions/reminders-schedule.ts). It runs hourly and triggers reminders only at 09:00 `Pacific/Auckland` to stay correct across NZ daylight saving changes.

## Documentation index

- [**Go-live checklist**](docs/go-live-checklist.md) — single-page launch sequence
- [Implementation plan](docs/implementation-plan.md) — phases, what's done, what's next
- [Architecture](docs/architecture.md) — high-level system map
- [Schema](docs/schema.md) — data model walkthrough
- [Route map](docs/route-map.md) — every URL and who can reach it
- [Decisions](docs/decisions.md) — ADR-style technical choices
- [Assumptions](docs/assumptions.md) — open questions & defaults

## Brand notes

The site must feel **editorial, fashion-inspired, premium, soft, warm, clean and slightly playful** — never corporate / SaaS / Shopify-default.

Core brand line: **"like the olive to your martini"** — used as the editorial signature throughout.
