-- 00028_root_role.sql
-- Add root role: the supreme administrator.
-- Can only be assigned via Supabase SQL / service role, not through the app UI.
-- Cannot be deleted or banned. Can assign admin role (alongside president).
-- Can delete any user including admin and president.

-- 1. Insert the root role (display_order -1 = above president)
insert into roles (id, name, display_order) values
  ('root', 'Root', -1)
on conflict (id) do update set name = excluded.name, display_order = excluded.display_order;

-- 2. Trigger function: root user's role cannot be changed
-- (profile fields like name/phone/avatar can still be updated)
create or replace function public.protect_root_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Block role changes on root user (allow other profile field updates)
  if old.role_id = 'root' and new.role_id != 'root' then
    raise exception 'রুট ব্যবহারকারীর ভূমিকা পরিবর্তন করা যাবে না।';
  end if;
  return new;
end;
$$;

-- Apply protection to profiles updates (ban/unban/role change)
drop trigger if exists protect_root_user on public.profiles;
create trigger protect_root_user
  before update on public.profiles
  for each row
  execute function public.protect_root_user();

-- 3. Update the restrict_admin_assignment trigger to allow root to assign admin
create or replace function public.restrict_admin_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only enforce when someone is being assigned the admin role
  if new.role_id = 'admin' and old.role_id != 'admin' then
    -- Check if the current user is PR or root
    if not exists (
      select 1 from profiles
      where id = auth.uid() and role_id in ('pr', 'root')
    ) then
      raise exception 'শুধুমাত্র সভাপতি বা রুট অ্যাডমিন নিয়োগ দিতে পারবেন।';
    end if;
  end if;
  return new;
end;
$$;

-- 4. Update profiles_role_update policy to include root
drop policy if exists "profiles_role_update" on public.profiles;
create policy "profiles_role_update" on public.profiles
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role_id in ('pr', 'vp', 'admin', 'root'))
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role_id in ('pr', 'vp', 'admin', 'root'))
  );

-- 5. Add root to all RLS policies that include pr/vp/admin
-- This ensures root has access to everything

-- Events
drop policy if exists "events_write_authorized" on public.events;
create policy "events_write_authorized" on public.events
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'jgs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'jgs', 'ofs', 'ors'])
  );

-- Event comments
drop policy if exists "comments_delete" on public.event_comments;
create policy "comments_delete" on public.event_comments
  for delete using (
    auth.uid() = user_id
    or public.is_any_role(array['pr', 'vp', 'admin', 'root'])
  );

-- Gallery
drop policy if exists "gallery_write_authorized" on public.gallery_items;
create policy "gallery_write_authorized" on public.gallery_items
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
  );

drop policy if exists "gallery_delete_owner_or_admin" on public.gallery_items;
create policy "gallery_delete_owner_or_admin" on public.gallery_items
  for delete using (
    auth.uid() = uploaded_by
    or public.is_any_role(array['pr', 'vp', 'admin', 'root'])
  );

-- Calendar
drop policy if exists "calendar_write_authorized" on public.calendar_events;
create policy "calendar_write_authorized" on public.calendar_events
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'jgs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'jgs', 'ofs', 'ors'])
  );

-- Notices
drop policy if exists "notices_write_authorized" on public.notices;
create policy "notices_write_authorized" on public.notices
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'jgs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'jgs', 'ofs', 'ors'])
  );

-- Expenses
drop policy if exists "expenses_read_authorized" on public.expenses;
create policy "expenses_read_authorized" on public.expenses
  for select using (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'tr', 'ofs', 'ors', 'rds'])
  );

drop policy if exists "expenses_create_authorized" on public.expenses;
create policy "expenses_create_authorized" on public.expenses
  for insert with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'tr', 'ofs', 'ors', 'rds'])
  );

drop policy if exists "expenses_modify_authorized" on public.expenses;
create policy "expenses_modify_authorized" on public.expenses
  for update using (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'rds'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'rds'])
  );

drop policy if exists "expenses_delete_authorized" on public.expenses;
create policy "expenses_delete_authorized" on public.expenses
  for delete using (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'rds'])
  );

-- Budgets
drop policy if exists "budgets_read_authorized" on public.budgets;
create policy "budgets_read_authorized" on public.budgets
  for select using (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'cs', 'acs', 'rds'])
  );

drop policy if exists "budgets_write_authorized" on public.budgets;
create policy "budgets_write_authorized" on public.budgets
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'cs', 'acs', 'rds'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'cs', 'acs', 'rds'])
  );

-- Courses
drop policy if exists "courses_write_authorized" on public.course_schedules;
create policy "courses_write_authorized" on public.course_schedules
  for all using (
    public.is_any_role(array['cc', 'pr', 'vp', 'admin', 'root'])
  )
  with check (
    public.is_any_role(array['cc', 'pr', 'vp', 'admin', 'root'])
  );

-- Attendance
drop policy if exists "attendance_write_authorized" on public.attendance;
create policy "attendance_write_authorized" on public.attendance
  for all using (
    public.is_any_role(array['cc', 'pr', 'vp', 'admin', 'root', 'gs', 'jgs'])
  )
  with check (
    public.is_any_role(array['cc', 'pr', 'vp', 'admin', 'root', 'gs', 'jgs'])
  );

-- Update upsert_attendance function to include root
create or replace function public.upsert_attendance(
  p_course_schedule_id uuid,
  p_class_day int,
  p_arrival_time time,
  p_exit_time time,
  p_note text,
  p_is_present boolean
)
returns setof attendance
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_any_role(array['cc', 'pr', 'vp', 'admin', 'root', 'gs', 'jgs']) then
    raise exception 'not authorized';
  end if;

  insert into attendance (course_schedule_id, class_day, arrival_time, exit_time, note, is_present, created_by)
  values (p_course_schedule_id, p_class_day, p_arrival_time, p_exit_time, p_note, p_is_present, auth.uid())
  on conflict (course_schedule_id, class_day)
  do update set
    arrival_time = excluded.arrival_time,
    exit_time = excluded.exit_time,
    note = excluded.note,
    is_present = excluded.is_present;

  return query
    select *
    from attendance
    where course_schedule_id = p_course_schedule_id
      and class_day = p_class_day;
end;
$$;

-- Donations
drop policy if exists "donations_delete_admin" on public.donations;
create policy "donations_delete_admin" on public.donations
  for delete using (public.is_any_role(array['pr', 'vp', 'admin', 'root', 'tr']));

-- Sponsors
drop policy if exists "sponsors_manage_authorized" on public.sponsors;
create policy "sponsors_manage_authorized" on public.sponsors
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'tr'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'tr'])
  );

-- Committee contacts
drop policy if exists "committee_write_admin" on public.committee_contacts;
create policy "committee_write_admin" on public.committee_contacts
  for all using (public.is_any_role(array['pr', 'vp', 'admin', 'root']))
  with check (public.is_any_role(array['pr', 'vp', 'admin', 'root']));

-- App config
drop policy if exists "app_config_write_admin" on public.app_config;
create policy "app_config_write_admin" on public.app_config
  for all using (public.is_any_role(array['pr', 'vp', 'admin', 'root']))
  with check (public.is_any_role(array['pr', 'vp', 'admin', 'root']));

-- Storage: gallery bucket
drop policy if exists "gallery_storage_authorized_write" on storage.objects;
create policy "gallery_storage_authorized_write"
on storage.objects for insert
with check (
  bucket_id = 'gallery'
  and public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
);

drop policy if exists "gallery_storage_authorized_update" on storage.objects;
create policy "gallery_storage_authorized_update"
on storage.objects for update
using (
  bucket_id = 'gallery'
  and public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
)
with check (
  bucket_id = 'gallery'
  and public.is_any_role(array['pr', 'vp', 'admin', 'root', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
);

drop policy if exists "gallery_storage_delete_owner_or_admin" on storage.objects;
create policy "gallery_storage_delete_owner_or_admin"
on storage.objects for delete
using (
  bucket_id = 'gallery'
  and (
    owner = (select auth.uid())
    or public.is_any_role(array['pr', 'vp', 'admin', 'root'])
  )
);

-- Notifications: include root in PR-level recipients
create or replace function public.notify_sponsor_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_users_by_role(
    array['pr', 'vp', 'admin', 'root', 'gs', 'tr'],
    'sponsor_inquiry',
    'নতুন স্পনসর ইনকোয়ারি',
    format('কোম্পানি "%s" থেকে নতুন স্পনসর ইনকোয়ারি এসেছে।', new.company_name),
    jsonb_build_object('href', '/dashboard/spn', 'sponsor_id', new.id)
  );
  return new;
end;
$$;

create or replace function public.notify_donation_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_users_by_role(
    array['tr', 'pr', 'vp', 'admin', 'root'],
    'donation',
    'নতুন অনুদান এসেছে',
    format('"%s" থেকে নতুন অনুদান এসেছে।', coalesce(nullif(new.donor_name, ''), 'একজন দাতা')),
    jsonb_build_object('href', '/dashboard/dnt', 'donation_id', new.id)
  );
  return new;
end;
$$;
