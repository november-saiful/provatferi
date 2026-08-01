-- 00003_calendar_and_notices.sql
-- Calendar (cln) + Notice board (ntb)

create type if not exists public.calendar_category as enum ('general', 'meeting', 'event', 'emergency', 'custom');

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category calendar_category default 'general',
  custom_category text,
  start_date timestamptz not null,
  end_date timestamptz,
  description text,
  location text,
  is_public boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_pinned boolean default false,
  is_public boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.calendar_events enable row level security;
alter table public.notices enable row level security;

-- Calendar
drop policy if exists "calendar_read_public" on public.calendar_events;
create policy "calendar_read_public" on public.calendar_events for select using (true);

drop policy if exists "calendar_write_authorized" on public.calendar_events;
create policy "calendar_write_authorized" on public.calendar_events
  for all using (
    public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'ofs', 'ors'])
  );

-- Notices
drop policy if exists "notices_read_public" on public.notices;
create policy "notices_read_public" on public.notices for select using (true);

drop policy if exists "notices_write_authorized" on public.notices;
create policy "notices_write_authorized" on public.notices
  for all using (
    public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'ofs', 'ors'])
  );

drop trigger if exists notices_set_updated_at on public.notices;
create trigger notices_set_updated_at
  before update on public.notices
  for each row execute function public.set_updated_at();
