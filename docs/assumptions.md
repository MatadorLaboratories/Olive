# Assumptions & open questions

This document tracks every commercial / product decision I've made on the user's behalf during the build, plus the genuine open questions that need their input. Things move from **Open** → **Confirmed** as the user weighs in.

---

## Confirmed defaults

| # | Assumption | Why |
| - | ---------- | --- |
| 1 | **NZD only**, GST-inclusive pricing displayed | NZ business; multi-currency is over-scope for v1 |
| 2 | **Aggregate inventory** per product (not per-unit serials) | Linen is fungible; schema permits a future serial extension |
| 3 | **Single login page**, role-based routing — admin not hidden | Cleaner for resale + simpler mental model |
| 4 | **DB is the CMS** — no Sanity/Contentful | Brief explicit; adds resale value |
| 5 | **Vendor pricing** = per-vendor discount percent (Trade-10 / 15 / 20 / Custom) | Simpler than separate price lists; admin-set per account |
| 6 | **Booking reference format**: `OLV-1042` (4-digit zero-padded) | Tasteful, recognisable, fits invoices |
| 7 | **Reminder cadence**: 35d / 30d / 14d / 7d before event | Standard events-industry ramp; brief says "30-day rule" but won't object to softer 35d heads-up |
| 8 | **Deposit = 50%** | Per brief |
| 9 | **First admin = bootstrap email** tracked in a migration | Trigger creates this user as admin on first signup; everyone else is `client` until upgraded |
| 10 | **`/api/stripe/webhook`** receives Stripe events; webhooks update payment + booking status | Standard pattern |
| 11 | **Image strategy**: Supabase Storage for uploads, `next/image` for marketing | Per brief preference |
| 12 | **Typography**: Fraunces (display) + Inter (UI) | Free, premium feel, no licensing cost for buyer |
| 13 | **Brand line "like the olive to your martini"** kept verbatim and used as the editorial signature in hero, footer, and a dedicated section | Per brief |
| 14 | **Email**: Resend for transactional | Clean DX, Edge-compatible |

---

## Open questions for the founder

These need a yes/no / pick-one before they ship.

| # | Question | Default if no answer |
| - | -------- | -------------------- |
| 1 | What's the bootstrap admin email? | Track it in the bootstrap-admin migration — first signup auto-grants admin |
| 2 | What's the studio's official email + phone? | Placeholder copy in `src/config/site.ts` until updated |
| 3 | Do you want **Xero integration** in Phase 1? Or CSV export only until later? | Phase 4 (CSV in interim) |
| 4 | Do we ship **NZ Post / GoSweetSpot label printing** in v1, or button-out-to-portal? | Button-out + Phase 4 deeper integration |
| 5 | Is **Instagram Graph token** OK, or should we use a third-party widget? | Server-side Graph fetch + ISR (cleaner, no widget bloat) |
| 6 | **Newsletter ESP** — do you already have Mailchimp / Klaviyo / Beehiiv, or shall we build into Resend audiences? | Resend audiences; portable later |
| 7 | **Portfolio licensing** — can we use real wedding photos by default, or always require photographer credit + permission? | Always require credit; portfolio_items.vendors[] field already supports it |
| 8 | **Vendor discount tiers** — confirm the bands (10/15/20/custom)? | Will hard-code these as the seed list, admin can edit |
| 9 | **Delivery fee model** — flat per region, calculated by distance, or quoted? | Flat-per-region for v1; admin pricing module supports quoted overrides |
| 10 | **GST handling** — display GST-inclusive (default), exclusive, or toggle per cart? | Inclusive everywhere; Phase 4 invoice export shows GST line |
| 11 | **Custom napkin builder fabrics/edges** — your fixed list, or admin-defined? | Admin-defined enums via `cms_blocks['hospitality.options']` |
| 12 | **Content seed data** — drop in placeholder Unsplash imagery for first deploy, or hold for real shoot? | Placeholders now (replaceable in /admin/cms post-shoot) |

---

## Risk register

| Risk | Severity | Mitigation |
| ---- | -------- | ---------- |
| Stripe webhook race vs. user landing page | Medium | Server polls payment status on confirmation page if webhook hasn't fired |
| 30-day cutoff edge cases (timezones) | Medium | Store dates as `date` not `timestamptz`; compute cutoff in NZ time at the application layer |
| Vendor self-changes pricing tier | Low | RLS prevents writes to `vendor_profiles.discount_pct` from vendor |
| Inventory double-book on simultaneous bookings | Medium | Booking server action wraps the inventory check + insert in a single transaction |
| Image storage costs blow out | Low | Supabase Storage default tier is generous; admin upload UI will resize on the way in |
| Resend deliverability for `@olivelinen.co.nz` | Medium | DKIM/SPF/DMARC setup as part of Phase 1 cutover checklist |
