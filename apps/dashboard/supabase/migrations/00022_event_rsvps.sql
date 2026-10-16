-- 00022_event_rsvps.sql
-- RSVP backend for the Facebook-style event surfaces.
--
-- Users mark events as 'interested' or 'going' (at most one row per event+user).
-- Everyone can read the rows so public pages can show live attendee counts;
-- each user may insert/update/delete only their own row.

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('interested', 'going')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists event_rsvps_event_idx on public.event_rsvps (event_id);
create index if not exists event_rsvps_user_idx on public.event_rsvps (user_id);

alter table public.event_rsvps enable row level security;

-- Everyone can read RSVPs (public counts / guest lists).
drop policy if exists "event_rsvps_read_public" on public.event_rsvps;
create policy "event_rsvps_read_public" on public.event_rsvps
  for select using (true);

-- A user manages only their own RSVP row.
drop policy if exists "event_rsvps_insert_own" on public.event_rsvps;
create policy "event_rsvps_insert_own" on public.event_rsvps
  for insert with check (auth.uid() = user_id);

drop policy if exists "event_rsvps_update_own" on public.event_rsvps;
create policy "event_rsvps_update_own" on public.event_rsvps
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "event_rsvps_delete_own" on public.event_rsvps;
create policy "event_rsvps_delete_own" on public.event_rsvps
  for delete using (auth.uid() = user_id);

-- Realtime: counts and guest lists refresh without a page reload.
do $$
begin
  begin
    alter publication supabase_realtime add table public.event_rsvps;
  exception
    when duplicate_object then null; -- already a member
  end;
end;
$$;
