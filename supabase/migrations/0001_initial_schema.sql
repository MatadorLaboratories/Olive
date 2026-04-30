-- =====================================================================
-- Olive Linen — initial schema
-- ---------------------------------------------------------------------
-- Conventions
--   * Money is stored in INTEGER cents (NZD).
--   * IDs are UUIDs (gen_random_uuid()).
--   * `updated_at` maintained by trigger `set_updated_at`.
--   * RLS enabled on every public table; policies follow the schema.
--   * Domain enums defined as Postgres ENUM types for clarity & safety.
--   * Booking & inventory logic is mostly app-side; DB enforces invariants.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
create type public.user_role as enum ('client', 'vendor', 'staff', 'admin');

create type public.product_kind as enum ('hire', 'retail', 'both');

create type public.product_status as enum ('draft', 'active', 'archived');

create type public.vendor_status as enum (
  'applied', 'in_review', 'approved', 'suspended', 'rejected'
);

create type public.booking_status as enum (
  'enquiry',         -- initial enquiry, no money committed
  'quoted',          -- quote sent, awaiting acceptance
  'deposit_pending', -- accepted, awaiting deposit
  'confirmed',       -- deposit received, locked into calendar
  'final_pending',   -- inside 30-day window, awaiting final payment
  'final_paid',      -- fully paid
  'packed',          -- pulled & packed, ready to dispatch
  'delivered',       -- delivered to venue
  'returned',        -- returned to studio
  'completed',       -- closed off, post-event
  'cancelled',
  'archived'
);

create type public.payment_kind as enum ('deposit', 'final', 'adjustment', 'refund');
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

create type public.custom_order_status as enum (
  'new_request',
  'awaiting_quote',
  'quote_sent',
  'deposit_paid',
  'in_production',
  'ready',
  'completed',
  'cancelled'
);

create type public.enquiry_status as enum ('new', 'in_progress', 'converted', 'archived');

-- ---------------------------------------------------------------------
-- 2. Identity
-- ---------------------------------------------------------------------
-- profiles: 1:1 with auth.users — created via `on_auth_user_created` trigger.
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          public.user_role not null default 'client',
  full_name     text,
  business_name text,
  phone         text,
  avatar_url    text,
  email         text,                       -- denormalised for admin search; sync'd by trigger
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- vendor_profiles: extension table for trade accounts.
create table public.vendor_profiles (
  id                  uuid primary key references public.profiles(id) on delete cascade,
  status              public.vendor_status not null default 'applied',
  vendor_type         text,                  -- 'planner' | 'stylist' | 'venue' | 'wholesale' | other
  region              text,
  abn_or_nzbn         text,
  discount_pct        numeric(5,2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  discount_tier       text,                  -- 'trade-10' | 'trade-15' | 'trade-20' | 'custom'
  notes               text,
  approved_at         timestamptz,
  approved_by         uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index vendor_profiles_status_idx on public.vendor_profiles (status);
create trigger vendor_profiles_updated before update on public.vendor_profiles
  for each row execute function public.set_updated_at();

-- vendor_addresses: saved delivery presets for fast re-bookings.
create table public.vendor_addresses (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendor_profiles(id) on delete cascade,
  label       text not null,
  address_line text,
  city        text,
  region      text,
  postcode    text,
  contact_name text,
  contact_phone text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index vendor_addresses_vendor_idx on public.vendor_addresses (vendor_id);

-- ---------------------------------------------------------------------
-- 3. Catalogue & inventory
-- ---------------------------------------------------------------------
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  kind              public.product_kind not null default 'hire',
  status            public.product_status not null default 'draft',
  name              text not null,
  category          text,                              -- 'napkin' | 'tablecloth' | 'runner' | 'merch' | 'gift' …
  fabric            text,
  colour            text,
  size              text,
  description       text,
  short_description text,
  hero_image_url    text,
  gallery_urls      text[] not null default '{}',
  hire_price_cents  integer,                           -- per piece, single event
  retail_price_cents integer,
  replacement_cost_cents integer,                      -- charged on lost/damaged
  display_order     integer not null default 100,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index products_status_idx on public.products (status);
create index products_kind_idx on public.products (kind);
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();

-- inventory_items: aggregate per-product. Per-unit serial tracking is a future option.
create table public.inventory_items (
  product_id   uuid primary key references public.products(id) on delete cascade,
  total_qty    integer not null default 0 check (total_qty >= 0),
  damaged_qty  integer not null default 0 check (damaged_qty >= 0),
  lost_qty     integer not null default 0 check (lost_qty >= 0),
  retired_qty  integer not null default 0 check (retired_qty >= 0),
  stocktake_at timestamptz,
  stocktake_notes text,
  updated_at   timestamptz not null default now()
);
create trigger inventory_items_updated before update on public.inventory_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. Bookings
-- ---------------------------------------------------------------------
-- Bookings reference EITHER a client profile or a vendor (placing on behalf of a client).
create table public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique,           -- 'OLV-1042' (generated app-side)
  status              public.booking_status not null default 'enquiry',
  client_id           uuid references public.profiles(id) on delete set null,
  vendor_id           uuid references public.vendor_profiles(id) on delete set null,
  client_full_name    text,
  client_email        text,
  client_phone        text,

  -- event window
  event_date          date not null,
  delivery_date       date not null,
  return_date         date not null,
  delivery_address    text,
  delivery_city       text,
  delivery_region     text,
  delivery_window     text,
  collection_window   text,
  on_site_contact     text,

  -- finance
  subtotal_cents      integer not null default 0,
  discount_cents      integer not null default 0,
  delivery_fee_cents  integer not null default 0,
  total_cents         integer not null default 0,
  deposit_due_cents   integer not null default 0,
  deposit_paid_cents  integer not null default 0,
  final_due_cents     integer not null default 0,
  final_paid_cents    integer not null default 0,
  final_due_date      date,                            -- generally event_date - 30 days
  cutoff_locked       boolean not null default false,  -- becomes true at the 30-day rule
  admin_override      boolean not null default false,

  -- meta
  notes_internal      text,
  notes_client        text,
  timeline_url        text,
  source              text,                            -- 'web' | 'admin' | 'vendor'

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  confirmed_at        timestamptz,
  cancelled_at        timestamptz,

  constraint bookings_event_window check (delivery_date <= event_date and event_date <= return_date)
);
create index bookings_status_idx on public.bookings (status);
create index bookings_event_date_idx on public.bookings (event_date);
create index bookings_client_idx on public.bookings (client_id);
create index bookings_vendor_idx on public.bookings (vendor_id);
create trigger bookings_updated before update on public.bookings
  for each row execute function public.set_updated_at();

create table public.booking_items (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid not null references public.bookings(id) on delete cascade,
  product_id        uuid not null references public.products(id),
  quantity          integer not null check (quantity > 0),
  unit_price_cents  integer not null,
  line_total_cents  integer not null,
  notes             text,
  created_at        timestamptz not null default now()
);
create index booking_items_booking_idx on public.booking_items (booking_id);
create index booking_items_product_idx on public.booking_items (product_id);

-- payments: every Stripe charge creates a row.
create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid references public.bookings(id) on delete set null,
  custom_order_id   uuid,                             -- forward ref, set fk below
  kind              public.payment_kind not null,
  status            public.payment_status not null default 'pending',
  amount_cents      integer not null,
  currency          char(3) not null default 'NZD',
  stripe_payment_intent text,
  stripe_charge_id  text,
  receipt_url       text,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index payments_booking_idx on public.payments (booking_id);
create index payments_custom_order_idx on public.payments (custom_order_id);
create trigger payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. Custom / hospitality orders (napkin builder)
-- ---------------------------------------------------------------------
create table public.custom_orders (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique,
  status              public.custom_order_status not null default 'new_request',
  customer_id         uuid references public.profiles(id) on delete set null,
  customer_type       text,                          -- 'restaurant' | 'venue' | 'planner' | 'wedding_client' | 'corporate' | 'other'
  business_name       text,
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  fabric              text,
  edge_style          text,
  colour              text,
  quantity_tier       text,                          -- 'small_set' | '40+' | '100+' | '500+' | '1000+' | '5000+'
  quantity            integer,
  preferred_deadline  date,
  brand_notes         text,
  logo_url            text,
  inspiration_urls    text[] not null default '{}',
  quote_total_cents   integer,
  payment_setting     text,                          -- 'quote_only' | 'deposit' | 'full_payment'
  internal_notes      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index custom_orders_status_idx on public.custom_orders (status);
create trigger custom_orders_updated before update on public.custom_orders
  for each row execute function public.set_updated_at();

alter table public.payments
  add constraint payments_custom_order_fk
  foreign key (custom_order_id) references public.custom_orders(id) on delete set null;

-- ---------------------------------------------------------------------
-- 6. Messaging & documents
-- ---------------------------------------------------------------------
create table public.message_threads (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid references public.bookings(id) on delete cascade,
  custom_order_id uuid references public.custom_orders(id) on delete cascade,
  subject         text,
  created_at      timestamptz not null default now(),
  constraint thread_anchor check (
    (booking_id is not null)::int + (custom_order_id is not null)::int = 1
  )
);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.message_threads(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  attachments text[] not null default '{}',
  created_at  timestamptz not null default now()
);
create index messages_thread_idx on public.messages (thread_id);

create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid references public.bookings(id) on delete cascade,
  custom_order_id uuid references public.custom_orders(id) on delete cascade,
  kind            text not null,                   -- 'quote' | 'invoice' | 'receipt' | 'timeline' | 'contract' | 'other'
  name            text not null,
  storage_path    text not null,                   -- supabase storage path
  size_bytes      integer,
  mime_type       text,
  created_at      timestamptz not null default now(),
  constraint doc_anchor check (
    (booking_id is not null)::int + (custom_order_id is not null)::int = 1
  )
);

-- ---------------------------------------------------------------------
-- 7. Public content (CMS)
-- ---------------------------------------------------------------------
create table public.cms_blocks (
  key         text primary key,                 -- 'home.hero' | 'home.brand_statement' | 'about.body' …
  data        jsonb not null,
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz not null default now()
);
create trigger cms_blocks_updated before update on public.cms_blocks
  for each row execute function public.set_updated_at();

create table public.portfolio_items (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  venue       text,
  event_date  date,
  cover_url   text,
  gallery_urls text[] not null default '{}',
  short_description text,
  body_md     text,
  vendors     text[] not null default '{}',
  published   boolean not null default false,
  display_order integer not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger portfolio_items_updated before update on public.portfolio_items
  for each row execute function public.set_updated_at();

create table public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  quote       text not null,
  attribution text not null,
  role        text,
  event       text,
  image_url   text,
  display_order integer not null default 100,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. Enquiries & tasks
-- ---------------------------------------------------------------------
create table public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  status        public.enquiry_status not null default 'new',
  source        text,                         -- 'home' | 'hospitality' | 'about' | other
  name          text,
  email         text,
  phone         text,
  event_date    date,
  message       text,
  converted_booking uuid references public.bookings(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index enquiries_status_idx on public.enquiries (status);

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text,
  due_at        timestamptz,
  urgent        boolean not null default false,
  completed_at  timestamptz,
  assigned_to   uuid references public.profiles(id) on delete set null,
  booking_id    uuid references public.bookings(id) on delete set null,
  custom_order_id uuid references public.custom_orders(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index tasks_due_idx on public.tasks (due_at) where completed_at is null;

-- ---------------------------------------------------------------------
-- 9. Email templates (admin-editable)
-- ---------------------------------------------------------------------
create table public.email_templates (
  key         text primary key,                 -- 'booking.confirmation' | 'booking.final_reminder.30' …
  subject     text not null,
  body_md     text not null,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);
create trigger email_templates_updated before update on public.email_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 10. Trigger: create profile on signup
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    case
      when new.email = current_setting('app.admin_bootstrap_email', true) then 'admin'::user_role
      else 'client'::user_role
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 11. Inventory availability — view + helper
-- ---------------------------------------------------------------------
-- Returns net allocated quantity for a product over a date range.
create or replace function public.allocated_qty(
  p_product_id uuid,
  p_start date,
  p_end date
) returns integer language sql stable as $$
  select coalesce(sum(bi.quantity), 0)::int
  from public.booking_items bi
  join public.bookings b on b.id = bi.booking_id
  where bi.product_id = p_product_id
    and b.status in ('confirmed', 'final_pending', 'final_paid', 'packed', 'delivered', 'deposit_pending', 'quoted')
    and b.return_date >= p_start
    and b.delivery_date <= p_end;
$$;

create or replace function public.available_qty(
  p_product_id uuid,
  p_start date,
  p_end date
) returns integer language sql stable as $$
  select greatest(0,
    coalesce(i.total_qty, 0)
    - coalesce(i.damaged_qty, 0)
    - coalesce(i.lost_qty, 0)
    - coalesce(i.retired_qty, 0)
    - public.allocated_qty(p_product_id, p_start, p_end)
  )::int
  from public.inventory_items i
  where i.product_id = p_product_id;
$$;
