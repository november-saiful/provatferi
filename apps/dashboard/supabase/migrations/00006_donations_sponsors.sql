-- 00006_donations_sponsors.sql
-- Donations (dnt) + Sponsors (spn) + committee contacts + app config

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  donor_email text,
  amount decimal(12,2) not null check (amount >= 0),
  message text,
  is_anonymous boolean default false,
  show_on_board boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  representative_name text,
  contact_email text not null,
  contact_phone text,
  brand_details text,
  proposed_event text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.committee_contacts (
  id uuid primary key default gen_random_uuid(),
  role_id text references roles(id),
  profile_id uuid references profiles(id),
  display_order int,
  is_public boolean default true
);

create table if not exists public.app_config (
  key text primary key,
  value text
);

alter table public.donations enable row level security;
alter table public.sponsors enable row level security;
alter table public.committee_contacts enable row level security;
alter table public.app_config enable row level security;

-- Donations.
-- NOTE: RLS is row-level only, so we cannot hide the `amount` column from the
-- public via row policies alone. We therefore:
--   * only allow authenticated users to SELECT from `donations` (full columns),
--   * expose names/messages to everyone through the `donor_board` view below.
drop policy if exists "donations_read_signedin" on public.donations;
create policy "donations_read_signedin" on public.donations
  for select using (auth.uid() is not null);

drop policy if exists "donations_insert_public" on public.donations;
create policy "donations_insert_public" on public.donations
  for insert with check (true);

drop policy if exists "donations_delete_admin" on public.donations;
create policy "donations_delete_admin" on public.donations
  for delete using (public.is_any_role(array['pr', 'vp', 'tr']));

-- Public donor board: names + messages only, no amounts, no emails.
create or replace view public.donor_board
as
  select id, donor_name, message, created_at
  from public.donations
  where show_on_board = true and is_anonymous = false;

-- Give the anon role read access to the view. Postgres default has no grants.
grant select on public.donor_board to anon, authenticated;

-- Sponsors
drop policy if exists "sponsors_insert_public" on public.sponsors;
create policy "sponsors_insert_public" on public.sponsors
  for insert with check (true);

drop policy if exists "sponsors_manage_authorized" on public.sponsors;
create policy "sponsors_manage_authorized" on public.sponsors
  for all using (
    public.is_any_role(array['pr', 'vp', 'gs', 'tr'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'gs', 'tr'])
  );

-- Committee contacts
drop policy if exists "committee_read_public" on public.committee_contacts;
create policy "committee_read_public" on public.committee_contacts for select using (true);

drop policy if exists "committee_write_admin" on public.committee_contacts;
create policy "committee_write_admin" on public.committee_contacts
  for all using (public.is_any_role(array['pr', 'vp']))
  with check (public.is_any_role(array['pr', 'vp']));

-- App config
drop policy if exists "app_config_read_public" on public.app_config;
create policy "app_config_read_public" on public.app_config for select using (true);

drop policy if exists "app_config_write_admin" on public.app_config;
create policy "app_config_write_admin" on public.app_config
  for all using (public.is_any_role(array['pr', 'vp']))
  with check (public.is_any_role(array['pr', 'vp']));
