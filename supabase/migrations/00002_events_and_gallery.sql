-- 00002_events_and_gallery.sql
-- Event Forum (evf) + Gallery (glr)

create type if not exists public.event_status as enum ('upcoming', 'ongoing', 'past');

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status event_status default 'upcoming',
  event_date timestamptz,
  location text,
  cover_image text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  user_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  image_url text not null,
  event_id uuid references events(id),
  uploaded_by uuid references profiles(id),
  is_public boolean default true,
  created_at timestamptz default now()
);

alter table public.events enable row level security;
alter table public.event_comments enable row level security;
alter table public.gallery_items enable row level security;

-- Events
drop policy if exists "events_read_public" on public.events;
create policy "events_read_public" on public.events for select using (true);

drop policy if exists "events_write_authorized" on public.events;
create policy "events_write_authorized" on public.events
  for all using (
    public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'ofs', 'ors'])
  );

-- Event comments
drop policy if exists "comments_read_public" on public.event_comments;
create policy "comments_read_public" on public.event_comments for select using (true);

drop policy if exists "comments_write_signedin" on public.event_comments;
create policy "comments_write_signedin" on public.event_comments
  for insert with check (auth.uid() = user_id and auth.uid() is not null);

drop policy if exists "comments_delete" on public.event_comments;
create policy "comments_delete" on public.event_comments
  for delete using (
    auth.uid() = user_id
    or public.is_any_role(array['pr', 'vp'])
  );

-- Gallery
drop policy if exists "gallery_read_public" on public.gallery_items;
create policy "gallery_read_public" on public.gallery_items for select using (true);

drop policy if exists "gallery_write_authorized" on public.gallery_items;
create policy "gallery_write_authorized" on public.gallery_items
  for all using (
    public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
  );

drop policy if exists "gallery_delete_owner_or_admin" on public.gallery_items;
create policy "gallery_delete_owner_or_admin" on public.gallery_items
  for delete using (
    auth.uid() = uploaded_by
    or public.is_any_role(array['pr', 'vp'])
  );
