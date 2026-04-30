# Implementation plan

A staged plan that delivers commercial value at each phase. Each phase is shippable.

## Phase 0 — Foundations  ✅ in progress / partially complete

Goal: clean, opinionated skeleton with a high-end public homepage.

- [x] Next.js 15 + TS strict + Tailwind v4 wired up
- [x] Design token system (colors, typography, motion) in `globals.css`
- [x] Folder architecture (route groups, services, lib, types)
- [x] `Wordmark`, `Header`, `Footer`, marketing layout
- [x] Premium homepage (hero, brand statement, featured products, portfolio collage, services, testimonials, IG, martini band)
- [x] Marketing route stubs (Shop, Portfolio, Hospitality, About, Cart, Hire entry)
- [x] Auth shell + login/signup
- [x] Booking flow scaffolding (six steps)
- [x] Client portal shell + dashboard
- [x] Trade portal shell + dashboard
- [x] Admin shell + dashboard + module placeholders
- [x] Supabase schema (profiles, vendors, products, inventory, bookings, payments, custom_orders, messaging, documents, CMS, enquiries, tasks, email templates)
- [x] RLS policies for every table
- [x] Storage buckets (public-media, client-uploads, documents)
- [x] Server / browser / admin Supabase clients
- [x] Auth middleware (cookie refresh + protected route gating)
- [x] Stripe webhook route stub
- [x] Repo docs: README, plan, architecture, schema, route-map, decisions, assumptions

## Phase 1 — Public site complete  ✅

Goal: a brand site good enough to convert browsers into bookings.

- [x] Data services layer with Supabase + seed-data fallback (`catalogue`, `portfolio`, `cms`)
- [x] On-brand seed catalogue (10 products), portfolio (4 case studies), testimonials, CMS blocks, FAQs
- [x] Real `Shop` page — product grid + URL-driven filters (kind / category / colour)
- [x] Product detail page (`/shop/[slug]`) with related products
- [x] Real `Portfolio` index (alternating editorial layout) + case study page with cover, body, credits, gallery, "next" link
- [x] Hospitality builder — 5-step stateful client UI (customer → fabric/edge/colour → quantity tier → contact → review/submit) writing to `custom_orders`
- [x] About page — CMS-bound with FAQ accordion
- [x] Contact form → `enquiries` insert + Resend notification email
- [x] Newsletter signup (Resend Audiences)
- [x] Instagram Graph fetch with `revalidate: 3600`, falls back to placeholders
- [x] Sitemap (static + dynamic product/portfolio routes), robots.txt
- [x] Dynamic OG image rendered at the edge
- [x] Homepage Hero / BrandStatement / FeaturedProducts / PortfolioPreview / Testimonials all CMS-bound

## Phase 2 — Booking + client portal  ✅

Goal: take real money for real bookings.

- [x] Cookie-scoped booking draft (`booking-draft.ts`) persisting across all flow steps
- [x] Date-aware `/hire/products` grid — `getAvailabilityMap()` with seed-mode fallback, low-stock pills, optimistic quantity steppers
- [x] All six flow steps wired to the draft (dates → products → quantities → details → account → deposit)
- [x] Supabase Auth signin/signup forms in `/hire/account`, with `?next=` deep-linking from any protected route
- [x] `createBookingFromDraft()` — inserts `bookings` + `booking_items` + Stripe PaymentIntent, clears the draft on success
- [x] Stripe Payment Element on `/hire/deposit`, brand-styled appearance options
- [x] `/hire/confirmation` editorial success page
- [x] Stripe webhook expanded — verifies signature, marks `payments.status`, transitions booking status, sends Resend confirmation email
- [x] Client portal: dashboard / bookings list / booking detail bound to real user
- [x] Booking detail with 30-day lock UI (computed via `differenceInCalendarDays`) and admin-override aware
- [x] Timeline upload via Supabase Storage with allow-list + size validation
- [x] Booking-scoped messaging thread (`/account/bookings/[ref]/messages`)
- [x] `/api/cron/reminders` — daily ramp at 35d/30d/14d/7d, idempotent via `tasks` audit rows
- [x] 47 routes build clean

## Phase 3 — Admin operating system  ✅

Goal: run the studio from one place.

- [x] Admin role gating — non-admin redirects to login (lenient in demo mode for review)
- [x] Admin dashboard live: KPIs (next-30 bookings, MTD revenue, outstanding, low-stock), today/this-week feed, "needs attention" list, upcoming bookings table, day widgets
- [x] Calendar — month view with prev/next nav; events / deliveries / collections / final-due colour-coded; today's snapshot tiles
- [x] Bookings list — filter by status/sort/search via URL params; outstanding column highlighted in clay
- [x] Bookings detail — line items, delivery, internal notes editor, status controls (12-state), 30-day override toggle, money sidebar, quick links to client thread
- [x] Inventory page — KPI strip, low-stock alert, full table with damaged/lost/retired/net usable + stock value
- [x] Products list + per-product editor (`/admin/products/[slug]`) — full upsert form with kind/status/category/fabric/colour/size/pricing/imagery
- [x] Clients table — lifetime spend, last event, contact links
- [x] Vendors table — approval queue with discount-tier picker (Trade-10/15/20), suspend/reject actions
- [x] CMS editor — JSON editors for hero, brand statement, About, FAQs, hospitality builder options, footer contact; auto-revalidates affected public routes on save
- [x] Enquiries inbox — list with reply / convert actions
- [x] Wholesale & custom orders — 8-stage Kanban pipeline
- [x] Finance — KPI strip, 6-month CSS bar chart, outstanding invoices table sorted by due date
- [x] Pricing — region delivery fees, trade-tier reference, custom-order pricing pointer
- [x] Reports — YTD revenue, forward pipeline, damage/loss cost, most-booked products, damage/loss table

## Phase 4 — Vendor + Custom builder + Integrations  ✅

- [x] Vendor application form (`/trade/apply`) creates auth user + profile (role=vendor) + vendor_profiles in `applied` status; notifies studio via Resend
- [x] Admin vendor approval queue with [discount-tier picker](src/components/admin/VendorRowActions.tsx) (already existed in Phase 3)
- [x] Trade portal end-to-end — guarded layout, dashboard with discount tier KPI, real bookings list, **address book CRUD** ([AddressBook](src/components/portal/AddressBook.tsx)), six-month **spend bar chart** + statement, messages index
- [x] Pending/suspended vendors see a graceful "review in progress" state instead of the portal
- [x] Vendor discount applied automatically in `BookingSummary` and `createBookingFromDraft` — line item shows `Trade-15 −15% applied`, discount written to `bookings.discount_cents`, `source = 'vendor-portal'`
- [x] Hospitality builder logo + inspiration uploads to `public-media/custom-uploads/{token}/...`; paths stored on `custom_orders.logo_url` / `inspiration_urls[]`
- [x] **Email templates system** — DB rows in `email_templates` with seed fallbacks ([seed/email-templates.ts](src/data/seed/email-templates.ts)). [renderTemplate](src/services/email-templates.ts) does `{{var}}` substitution + Markdown→HTML. Stripe webhook + reminders cron rewired to use templates
- [x] Templates seeded for: booking.confirmation · booking.final_paid · booking.final_reminder.30/14/7 · vendor.approved · custom_order.quote_sent
- [x] **Xero CSV export** at `/api/admin/xero-export?from=&to=` — emits Xero "Sales Invoices" import format, admin-only, exposed as a "Export Xero CSV" button on `/admin/finance`
- [x] **NZ Post + GoSweetSpot link-outs** on admin booking detail with pre-filled delivery address ([ShippingActions](src/components/admin/ShippingActions.tsx))
- [x] 55 routes build clean

## Out-of-scope for v1, designed for later

- Per-unit serial inventory tracking (RFID-friendly extension to `inventory_items`)
- Multi-currency
- Multi-warehouse / location
- Subscription-style hospitality napkin re-orders
- iOS/Android wrapper
