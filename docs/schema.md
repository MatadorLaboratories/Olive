# Schema

Source of truth: [`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql)
RLS policies: [`supabase/migrations/0002_rls_policies.sql`](../supabase/migrations/0002_rls_policies.sql)

## Tables (high-level)

| Table              | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `profiles`         | 1:1 with `auth.users`; holds `role` (client/vendor/staff/admin) |
| `vendor_profiles`  | Trade-account extension; status, discount tier                 |
| `vendor_addresses` | Saved delivery addresses for fast vendor re-bookings           |
| `products`         | Catalogue (hire / retail / both); pricing in cents             |
| `inventory_items`  | Aggregate stock counts per product                             |
| `bookings`         | One row per event hire; lifecycle status                       |
| `booking_items`    | Line items per booking                                         |
| `payments`         | Every Stripe charge, refund, adjustment                        |
| `custom_orders`    | Hospitality / wholesale napkin orders, 8-state pipeline        |
| `message_threads`  | One thread per booking *or* custom order                       |
| `messages`         | Thread messages with attachment URLs                           |
| `documents`        | Signed-URL files attached to a booking or custom order         |
| `cms_blocks`       | JSON content keyed by section (homepage, about, FAQ, etc.)     |
| `portfolio_items`  | Real-wedding case studies                                      |
| `testimonials`     | Quotes for the social-proof section                            |
| `enquiries`        | Inbound contact-form submissions                               |
| `tasks`            | Admin to-dos (with optional booking link)                      |
| `email_templates`  | Subject/body for transactional email triggers                  |

## Enums

```sql
user_role            : client | vendor | staff | admin
product_kind         : hire | retail | both
product_status       : draft | active | archived
vendor_status        : applied | in_review | approved | suspended | rejected
booking_status       : enquiry | quoted | deposit_pending | confirmed
                       | final_pending | final_paid | packed | delivered
                       | returned | completed | cancelled | archived
payment_kind         : deposit | final | adjustment | refund
payment_status       : pending | succeeded | failed | refunded
custom_order_status  : new_request | awaiting_quote | quote_sent
                       | deposit_paid | in_production | ready
                       | completed | cancelled
enquiry_status       : new | in_progress | converted | archived
```

## Key invariants

- **`bookings.event_date`** — `delivery_date <= event_date <= return_date` (CHECK constraint).
- **Money** — every `*_cents` is a non-negative integer.
- **Profile creation** — DB trigger `handle_new_user` inserts a `profiles` row on signup; the bootstrap admin email becomes `admin` automatically.
- **Cutoff lock** — `cutoff_locked = true` blocks self-service edits via RLS; admin override path bypasses.
- **Quantity helpers** — `available_qty()` and `allocated_qty()` SQL functions are the source of truth for stock checks.

## Storage buckets

| Bucket           | Public? | Owner key            | Purpose                                  |
| ---------------- | ------- | -------------------- | ---------------------------------------- |
| `public-media`   | yes     | admin                | marketing imagery, products, portfolio   |
| `client-uploads` | no      | path prefix `userId/`| timelines, brand uploads, inspiration    |
| `documents`      | no      | admin                | invoices, quotes, receipts, contracts    |

Read paths for private buckets are mediated by signed URLs generated server-side.

## Row-Level Security (RLS) summary

- **Public**: read active products, published portfolio, published testimonials, all `cms_blocks`. Insert into `enquiries`.
- **Authenticated client**: read/update own `profiles`, own `bookings` (writes blocked once `cutoff_locked`), own `messages`, own `documents`, own `custom_orders` (pre-quote).
- **Vendor**: same as client + write own `vendor_addresses`, full vendor-scoped bookings.
- **Staff**: all client/vendor reads + writes except admin-only tables.
- **Admin**: full read/write on every table; sole writer of `cms_blocks`, `email_templates`, products, portfolio, testimonials, payments adjustments.

The full policy set is in [`0002_rls_policies.sql`](../supabase/migrations/0002_rls_policies.sql).

## Generation

Run `npm run db:types` to regenerate `src/types/database.ts` from the live Supabase schema.
The hand-authored `src/types/domain.ts` mirrors the same shapes in camelCase for the application layer.
