-- 00015_email_verification.sql
-- Email verification flag + ban-gating for profiles.
-- `email_verified` mirrors `auth.users.email_confirmed_at` so the admin panel
-- can show only confirmed members without needing service-role access.

alter table public.profiles
  add column if not exists email_verified boolean default false;

-- Capture verification state at signup (OAuth providers confirm email at insert)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role_id, full_name, phone, academic_session, department, hall_name, reg_id, email_verified)
  values (
    new.id,
    new.email,
    'visitor',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'academic_session',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'hall_name',
    new.raw_user_meta_data->>'reg_id',
    new.email_confirmed_at is not null
  );
  return new;
end;
$$ language plpgsql security definer;

-- Keep `email_verified` in sync when Supabase marks an email as confirmed
-- (OTP verify, magic link click, confirmation email click, admin confirm)
create or replace function public.sync_email_verified()
returns trigger as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles set email_verified = true where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_verified on auth.users;
create trigger on_auth_user_verified
  after update on auth.users
  for each row
  when (new.email_confirmed_at is not null)
  execute function public.sync_email_verified();

-- Backfill: mark existing members based on real confirmation state.
-- Profiles without a matching auth user are treated as verified legacy rows.
update public.profiles p
set email_verified = coalesce(
  (select (a.email_confirmed_at is not null) from auth.users a where a.id = p.id),
  true
);

-- Prevent members from self-marking as verified (RLS allows owner updates).
-- Only pr / vp / admin can change it.
create or replace function public.protect_email_verified()
returns trigger as $$
begin
  if new.email_verified is distinct from old.email_verified then
    if not public.is_any_role(array['pr', 'vp', 'admin']) then
      raise exception 'শুধুমাত্র কমিটি সদস্যরা ইমেইল ভেরিফিকেশন স্ট্যাটাস পরিবর্তন করতে পারবেন।';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_email_verified on public.profiles;
create trigger protect_email_verified
  before update on public.profiles
  for each row
  execute function public.protect_email_verified();
