-- =====================================================================
-- Olive Linen — Row Level Security
-- ---------------------------------------------------------------------
-- Roles are read from `public.profiles.role`. We expose a small helper
-- `public.current_role()` so policies stay readable.
-- =====================================================================

create or replace function public.current_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'client'::public.user_role
  );
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select public.current_role() = 'admin';
$$;

create or replace function public.is_staff_or_admin() returns boolean
language sql stable as $$
  select public.current_role() in ('staff', 'admin');
$$;

-- ---------------------------------------------------------------------
-- Enable RLS on every public table
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.vendor_profiles   enable row level security;
alter table public.vendor_addresses  enable row level security;
alter table public.products          enable row level security;
alter table public.inventory_items   enable row level security;
alter table public.bookings          enable row level security;
alter table public.booking_items     enable row level security;
alter table public.payments          enable row level security;
alter table public.custom_orders     enable row level security;
alter table public.message_threads   enable row level security;
alter table public.messages          enable row level security;
alter table public.documents         enable row level security;
alter table public.cms_blocks        enable row level security;
alter table public.portfolio_items   enable row level security;
alter table public.testimonials      enable row level security;
alter table public.enquiries         enable row level security;
alter table public.tasks             enable row level security;
alter table public.email_templates   enable row level security;

-- ---------------------------------------------------------------------
-- profiles — users see their own; staff/admin see all
-- ---------------------------------------------------------------------
create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid() or public.is_staff_or_admin());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- products & inventory
-- ---------------------------------------------------------------------
-- Active products are public-readable; drafts/archived are admin-only.
create policy "products: read active"  on public.products
  for select using (status = 'active' or public.is_staff_or_admin());
create policy "products: write admin"  on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- Inventory levels are admin-only (we don't leak stock to public).
create policy "inventory: admin only" on public.inventory_items
  for all using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

-- ---------------------------------------------------------------------
-- bookings & items
-- ---------------------------------------------------------------------
create policy "bookings: read own" on public.bookings
  for select using (
    client_id = auth.uid()
    or vendor_id = auth.uid()
    or public.is_staff_or_admin()
  );
create policy "bookings: write own (limited)" on public.bookings
  for update using (
    (client_id = auth.uid() or vendor_id = auth.uid())
    and cutoff_locked = false
    or public.is_staff_or_admin()
  );
create policy "bookings: insert own" on public.bookings
  for insert with check (
    client_id = auth.uid() or vendor_id = auth.uid() or public.is_staff_or_admin()
  );

create policy "booking_items: read via booking" on public.booking_items
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.client_id = auth.uid() or b.vendor_id = auth.uid() or public.is_staff_or_admin())
    )
  );
create policy "booking_items: write via booking" on public.booking_items
  for all using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.client_id = auth.uid() or b.vendor_id = auth.uid() or public.is_staff_or_admin())
    )
  )
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.client_id = auth.uid() or b.vendor_id = auth.uid() or public.is_staff_or_admin())
    )
  );

-- ---------------------------------------------------------------------
-- payments — read via booking owner; writes are server-side only (service role bypasses RLS)
-- ---------------------------------------------------------------------
create policy "payments: read own" on public.payments
  for select using (
    public.is_staff_or_admin()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id and (b.client_id = auth.uid() or b.vendor_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- custom orders
-- ---------------------------------------------------------------------
create policy "custom_orders: own or admin" on public.custom_orders
  for select using (customer_id = auth.uid() or public.is_staff_or_admin());
create policy "custom_orders: write admin or own pre-quote" on public.custom_orders
  for update using (
    public.is_staff_or_admin()
    or (customer_id = auth.uid() and status in ('new_request', 'awaiting_quote'))
  );
create policy "custom_orders: insert anyone authed" on public.custom_orders
  for insert with check (true);

-- ---------------------------------------------------------------------
-- threads / messages / documents
-- ---------------------------------------------------------------------
create policy "threads: visible to participants" on public.message_threads
  for select using (
    public.is_staff_or_admin()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id and (b.client_id = auth.uid() or b.vendor_id = auth.uid())
    )
    or exists (
      select 1 from public.custom_orders c where c.id = custom_order_id and c.customer_id = auth.uid()
    )
  );

create policy "messages: read by thread access" on public.messages
  for select using (
    exists (
      select 1 from public.message_threads t
      where t.id = thread_id
        and (
          public.is_staff_or_admin()
          or exists (select 1 from public.bookings b where b.id = t.booking_id and (b.client_id = auth.uid() or b.vendor_id = auth.uid()))
          or exists (select 1 from public.custom_orders c where c.id = t.custom_order_id and c.customer_id = auth.uid())
        )
    )
  );

create policy "messages: insert by sender" on public.messages
  for insert with check (sender_id = auth.uid());

create policy "documents: read by anchor access" on public.documents
  for select using (
    public.is_staff_or_admin()
    or exists (select 1 from public.bookings b where b.id = booking_id and (b.client_id = auth.uid() or b.vendor_id = auth.uid()))
    or exists (select 1 from public.custom_orders c where c.id = custom_order_id and c.customer_id = auth.uid())
  );
create policy "documents: write admin" on public.documents
  for all using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

-- ---------------------------------------------------------------------
-- public content
-- ---------------------------------------------------------------------
create policy "cms: read all"   on public.cms_blocks
  for select using (true);
create policy "cms: write admin" on public.cms_blocks
  for all using (public.is_admin()) with check (public.is_admin());

create policy "portfolio: read published"   on public.portfolio_items
  for select using (published = true or public.is_staff_or_admin());
create policy "portfolio: write admin" on public.portfolio_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy "testimonials: read published" on public.testimonials
  for select using (published = true or public.is_staff_or_admin());
create policy "testimonials: write admin"   on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- enquiries / tasks / templates
-- ---------------------------------------------------------------------
create policy "enquiries: insert anyone"  on public.enquiries
  for insert with check (true);
create policy "enquiries: read admin"     on public.enquiries
  for select using (public.is_staff_or_admin());
create policy "enquiries: update admin"   on public.enquiries
  for update using (public.is_staff_or_admin());

create policy "tasks: admin only" on public.tasks
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "email_templates: admin only" on public.email_templates
  for all using (public.is_admin()) with check (public.is_admin());

-- vendor_profiles: vendor reads own; admin reads all.
create policy "vendor_profiles: read own" on public.vendor_profiles
  for select using (id = auth.uid() or public.is_staff_or_admin());
create policy "vendor_profiles: update own (limited)" on public.vendor_profiles
  for update using (id = auth.uid() or public.is_admin());
create policy "vendor_profiles: insert own" on public.vendor_profiles
  for insert with check (id = auth.uid());

create policy "vendor_addresses: own or admin" on public.vendor_addresses
  for all using (vendor_id = auth.uid() or public.is_staff_or_admin())
  with check (vendor_id = auth.uid() or public.is_staff_or_admin());
