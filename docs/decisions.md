# Architecture Decisions (ADR-style)

Each decision is dated, terse, and reversible. New decisions append; old ones get a `Superseded` note rather than disappearing.

---

## ADR-0001: Next.js 15 + App Router + React 19 — 2026-04-30

**Decision**: build on Next.js 15 (App Router) with React 19, TypeScript strict mode.

**Why**: Brief specifies Next.js + Netlify. App Router gives us native server actions, route groups for the four distinct user surfaces (marketing, booking, portal, admin), and per-route layouts that pair cleanly with role-based rendering. React 19 unlocks `useActionState` for the booking form ergonomics later.

**Trade-off**: App Router still has rough edges around third-party auth helpers, but the `@supabase/ssr` package handles SSR cookies cleanly.

---

## ADR-0002: Tailwind v4, CSS-first design tokens — 2026-04-30

**Decision**: Tailwind v4 with all design tokens declared in `globals.css` via `@theme`. No `tailwind.config.js`.

**Why**: The brand demands a custom palette (cream, olive, clay, sage, stone), bespoke type scale (Fraunces display + Inter UI), editorial spacing/motion. Defining these in CSS keeps the source of truth visible to anyone reading the file (including non-frontend devs and future agency teams) and avoids the JS config indirection.

**Risk**: The CSS-first config is newer; Tailwind v4 minor updates could break syntax. Acceptable for a clean greenfield build.

---

## ADR-0003: Supabase as auth + DB + storage — 2026-04-30

**Decision**: use Supabase for Postgres, Auth, Storage. RLS on every table.

**Why**: Brief lists Supabase as preferred. RLS gives us defense-in-depth — even a leaked anon key cannot read the wrong rows. Storage handles all uploads (logos, timelines, brand assets) without a separate service. A single tool drops integration complexity for a small team.

**Trade-off**: Vendor lock-in is real, but Postgres + a small admin client surface make migration mostly mechanical if we ever leave.

---

## ADR-0004: Database is the CMS — 2026-04-30

**Decision**: don't bolt on Sanity / Contentful. Editable content lives in `cms_blocks` (JSON keyed by section), `portfolio_items`, `testimonials`, `email_templates`. Admin module edits these.

**Why**: Brief says explicitly to keep CMS in-app. Adds resale value: a future buyer doesn't inherit a third-party subscription or a deploy webhook between systems. The admin team only learns one tool.

**Trade-off**: We re-build a small editorial UX in `/admin/cms`. Acceptable — it's a curated set of fields, not a free-form WYSIWYG.

---

## ADR-0005: Single login, role-based routing — 2026-04-30

**Decision**: one `/login` page for clients, vendors, and admins. After auth we route based on `profiles.role`.

**Why**: The brief floats both options. Single entry is cleaner for resale (one place to update branding), simpler for users who change roles (a planner who is also a wedding client), and avoids the "secret /admin URL" anti-pattern.

**Risk**: Brand bar must hold up on the login page (handled — see editorial split layout in `(auth)/layout.tsx`).

---

## ADR-0006: Stripe + Resend for payments + email — 2026-04-30

**Decision**: Stripe for payments, Resend for transactional email.

**Why**: Stripe is brief-default. Resend has clean DX for templated transactional sending and pairs well with Next.js + Edge runtimes if we ever go that direction.

---

## ADR-0007: Money in integer cents — 2026-04-30

**Decision**: all monetary amounts stored in DB as `integer` cents (NZD). Display formatting handled by `lib/format.ts`.

**Why**: Standard fix for floating-point drift. Stripe expects amounts in the smallest unit anyway, so the DB shape mirrors the API.

---

## ADR-0008: Aggregate inventory (no per-unit serials) — 2026-04-30

**Decision**: track stock as aggregate counts on `inventory_items` (total / damaged / lost / retired).

**Why**: Linen is fungible — we hire "12 scallop napkins, bone", not "napkin #00041". Per-unit tracking is not justified for v1.

**Future-friendliness**: a `linen_units` table can be added without breaking the existing model — `available_qty` becomes `count(*) where status = 'available'`.

---

## ADR-0009: Fraunces (display) + Inter (UI) — 2026-04-30

**Decision**: Fraunces for display serif, Inter for UI sans. Loaded via `next/font` for zero-CLS.

**Why**: Fraunces is variable, has SOFT and WONK axes that match the warm-but-confident Olive feel without being precious; it's also free, so a future buyer doesn't inherit a Monotype/Adobe Fonts contract. Inter is the gold standard for UI clarity at small sizes.

**Reject**: Cormorant (too wedding-cliché), Recoleta (commercial license), Editorial New (commercial license).

---

## ADR-0010: 50% deposit + 30-day cutoff lock — 2026-04-30

**Decision**: implement deposit at 50%, final due at event - 30 days, with a `cutoff_locked` flag that blocks self-service edits inside the window. Admin override path always available.

**Why**: Matches brief verbatim. Schema-level flag (vs. computed) makes it easy to audit ("when was this booking locked?") and lets admins manually unlock without re-running calculations.

---

## ADR-0011: Netlify deployment via Next.js Runtime — 2026-04-30

**Decision**: deploy to Netlify with the auto-detected Next.js runtime.

**Why**: Brief specifies Netlify. The runtime supports App Router, server actions, and edge middleware out of the box. Security headers configured in `netlify.toml`.

**Watchpoint**: incremental cache for ISR is region-pinned on Netlify; Instagram feed (Phase 1) will use built-in `revalidate` directives, not Netlify-specific cache APIs, to keep portability.
