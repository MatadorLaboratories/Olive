# Route map

Generated from the App Router file structure. `Auth` indicates middleware-level gating; layouts apply additional role checks.

## Public — `(marketing)`

| Path                         | Purpose                                            | Auth |
| ---------------------------- | -------------------------------------------------- | ---- |
| `/`                          | Premium homepage                                   | none |
| `/hire`                      | Booking flow entry                                 | none |
| `/shop`                      | Retail catalogue                                   | none |
| `/shop/[slug]`               | Product detail (Phase 1)                           | none |
| `/portfolio`                 | Real weddings index (Phase 1)                      | none |
| `/portfolio/[slug]`          | Case study (Phase 1)                               | none |
| `/hospitality`               | Custom napkin landing                              | none |
| `/hospitality/builder`       | Custom napkin builder (Phase 4)                    | none |
| `/about`                     | Brand story                                        | none |
| `/cart`                      | Cart (Phase 2)                                     | none |

## Booking — `(booking)`

| Path                  | Step             | Auth   |
| --------------------- | ---------------- | ------ |
| `/hire/dates`         | 01 — choose dates       | none   |
| `/hire/products`      | 02 — choose linen       | none   |
| `/hire/quantities`    | 03 — quantities         | none   |
| `/hire/details`       | 04 — venue/contacts     | none   |
| `/hire/account`       | 05 — sign in or create  | none   |
| `/hire/deposit`       | 06 — pay 50%            | client |

## Auth — `(auth)`

| Path              | Purpose                | Auth |
| ----------------- | ---------------------- | ---- |
| `/login`          | Single login entry     | none |
| `/signup`         | Client account create  | none |
| `/forgot-password`| Reset link             | none |

## Client portal — `(account)`

All routes require an authenticated `client`.

| Path                       | Purpose                          |
| -------------------------- | -------------------------------- |
| `/account`                 | Dashboard snapshot               |
| `/account/bookings`        | List of bookings                 |
| `/account/bookings/[ref]`  | Booking detail                   |
| `/account/messages`        | Studio thread                    |
| `/account/documents`       | Quotes, invoices, contracts      |
| `/account/history`         | Past bookings                    |
| `/account/settings`        | Profile, password, notifications |

## Trade portal — `(trade)`

All routes require an authenticated `vendor` whose status is `approved`.

| Path                     | Purpose                                |
| ------------------------ | -------------------------------------- |
| `/trade`                 | Dashboard, discount tier, KPIs         |
| `/trade/bookings`        | Vendor-scoped bookings                 |
| `/trade/preferences`     | Saved venues, planner contacts         |
| `/trade/documents`       | Files                                  |
| `/trade/spend`           | Year-to-date spend                     |
| `/trade/messages`        | Studio thread                          |
| `/trade/apply`           | Trade application form (public)        |

## Admin — `(admin)`

Requires `admin` (or `staff` for read-only modules in v2).

| Path                       | Module                            |
| -------------------------- | --------------------------------- |
| `/admin`                   | Dashboard                         |
| `/admin/calendar`          | Calendar                          |
| `/admin/bookings`          | Bookings list                     |
| `/admin/bookings/[ref]`    | Booking detail (Phase 3)          |
| `/admin/inventory`         | Stock                             |
| `/admin/products`          | Catalogue                         |
| `/admin/pricing`           | Pricing                           |
| `/admin/finance`           | Finance                           |
| `/admin/clients`           | Clients                           |
| `/admin/vendors`           | Vendors                           |
| `/admin/wholesale`         | Custom orders                     |
| `/admin/enquiries`         | Inbox                             |
| `/admin/reports`           | Reports                           |
| `/admin/cms`               | CMS                               |

## API / route handlers

| Path                       | Purpose                                |
| -------------------------- | -------------------------------------- |
| `/api/stripe/webhook`      | Stripe webhook receiver                |
| `/api/instagram` (Phase 1) | Cached Graph fetch for homepage strip  |

## Middleware

`src/middleware.ts` runs on every non-static request. It refreshes Supabase auth cookies and redirects unauthenticated requests to `/login` for `/account`, `/trade`, `/admin`.
