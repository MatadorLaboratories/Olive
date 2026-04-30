-- =====================================================================
-- Olive Linen — Storage buckets
-- =====================================================================
-- Buckets:
--   public-media       : marketing imagery, portfolio, product images (public read)
--   client-uploads     : timelines, brand uploads, inspiration (private — owner-scoped)
--   documents          : invoices, quotes, contracts (private — admin + booking owner)

insert into storage.buckets (id, name, public)
values
  ('public-media',  'public-media',  true),
  ('client-uploads','client-uploads',false),
  ('documents',     'documents',     false)
on conflict (id) do nothing;

-- public-media: anyone can read; admins write.
create policy "public-media: read all" on storage.objects for select
  using (bucket_id = 'public-media');
create policy "public-media: admin writes" on storage.objects for all
  using (bucket_id = 'public-media' and public.is_admin())
  with check (bucket_id = 'public-media' and public.is_admin());

-- client-uploads: owner-scoped via path prefix `userId/...`.
create policy "client-uploads: read own or admin" on storage.objects for select
  using (
    bucket_id = 'client-uploads'
    and (split_part(name, '/', 1) = auth.uid()::text or public.is_staff_or_admin())
  );
create policy "client-uploads: insert own" on storage.objects for insert
  with check (
    bucket_id = 'client-uploads'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- documents: admin only writes; booking owner reads via signed URLs from app.
create policy "documents: admin all" on storage.objects for all
  using (bucket_id = 'documents' and public.is_staff_or_admin())
  with check (bucket_id = 'documents' and public.is_staff_or_admin());
