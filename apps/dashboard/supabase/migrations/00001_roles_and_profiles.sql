-- 00001_roles_and_profiles.sql
-- Roles + profiles, with RLS. Run in order.

create table if not exists public.roles (
  id text primary key,
  name text not null,
  display_order int default 99,
  created_at timestamptz default now()
);

insert into roles (id, name, display_order) values
  ('pr', 'President', 1),
  ('vp', 'Vice President', 2),
  ('gs', 'General Secretary', 3),
  ('jgs', 'Joint General Secretary', 4),
  ('tr', 'Treasurer', 5),
  ('ofs', 'Office Secretary', 6),
  ('ors', 'Organizing Secretary', 7),
  ('cs', 'Cultural Secretary', 8),
  ('acs', 'Assistant Cultural Secretary', 9),
  ('pps', 'Publicity and Publication Secretary', 10),
  ('prs', 'Public Relations Secretary', 11),
  ('rds', 'Record and Documentation Secretary', 12),
  ('cc', 'Course Coordinator', 13),
  ('alm', 'Alumni', 14),
  ('visitor', 'Visitor', 99)
on conflict (id) do update set name = excluded.name, display_order = excluded.display_order;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role_id text not null references roles(id) default 'visitor',
  display_id text,
  full_name text,
  email text not null,
  phone text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role_id, full_name)
  values (
    new.id,
    new.email,
    'visitor',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles_read_public" on public.profiles;
create policy "profiles_read_public" on public.profiles
  for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_role_update" on public.profiles;
create policy "profiles_role_update" on public.profiles
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role_id in ('pr', 'vp'))
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role_id in ('pr', 'vp'))
  );

-- Helper: is the current user a given role / one of a set of roles
create or replace function public.is_role(p_role text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role_id = p_role);
$$;

create or replace function public.is_any_role(p_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role_id = any(p_roles));
$$;

-- Updated_at maintenance helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
