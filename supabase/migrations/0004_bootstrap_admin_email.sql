-- =====================================================================
-- Olive Linen — bootstrap admin email
-- ---------------------------------------------------------------------
-- Supabase does not permit setting arbitrary custom database parameters
-- from our deployment path, so we keep the bootstrap admin email in a
-- tracked migration by updating the auth trigger directly.
-- =====================================================================

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    case
      when lower(new.email) = 'callum@matadorlabs.co.uk' then 'admin'::user_role
      else 'client'::user_role
    end
  );
  return new;
end;
$$;
