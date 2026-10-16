-- 00024_admin_full_access.sql
-- The admin role should have every access the PR role has. Earlier migrations
-- listed only 'pr'/'vp' in many policies, which silently locked the admin out
-- of parts of the app. This migration re-creates each affected policy/function
-- with 'admin' added to the role set.
--
-- Deliberately NOT changed: assigning the 'admin' role itself stays PR-only
-- (see 00013_admin_role.sql — single-admin constraint + PR-only appointment).
--
-- Also grants the admin the PR-level in-app notifications for sponsor
-- inquiries and donations (previously pr/vp/gs/tr and tr/pr/vp only).

-- ── Profiles: role updates (admin panel) ─────────────────────────────────────
drop policy if exists "profiles_role_update" on public.profiles;
create policy "profiles_role_update" on public.profiles
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role_id in ('pr', 'vp', 'admin'))
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role_id in ('pr', 'vp', 'admin'))
  );

-- ── Events + Gallery (00002) ─────────────────────────────────────────────────
drop policy if exists "events_write_authorized" on public.events;
create policy "events_write_authorized" on public.events
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'ofs', 'ors'])
  );

drop policy if exists "comments_delete" on public.event_comments;
create policy "comments_delete" on public.event_comments
  for delete using (
    auth.uid() = user_id
    or public.is_any_role(array['pr', 'vp', 'admin'])
  );

drop policy if exists "gallery_write_authorized" on public.gallery_items;
create policy "gallery_write_authorized" on public.gallery_items
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
  );

drop policy if exists "gallery_delete_owner_or_admin" on public.gallery_items;
create policy "gallery_delete_owner_or_admin" on public.gallery_items
  for delete using (
    auth.uid() = uploaded_by
    or public.is_any_role(array['pr', 'vp', 'admin'])
  );

-- ── Calendar + Notices (00003) ───────────────────────────────────────────────
drop policy if exists "calendar_write_authorized" on public.calendar_events;
create policy "calendar_write_authorized" on public.calendar_events
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'ofs', 'ors'])
  );

drop policy if exists "notices_write_authorized" on public.notices;
create policy "notices_write_authorized" on public.notices
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'ofs', 'ors'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'ofs', 'ors'])
  );

-- ── Finance (00004) ──────────────────────────────────────────────────────────
drop policy if exists "expenses_read_authorized" on public.expenses;
create policy "expenses_read_authorized" on public.expenses
  for select using (
    public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'tr', 'ofs', 'ors', 'rds'])
  );

drop policy if exists "expenses_create_authorized" on public.expenses;
create policy "expenses_create_authorized" on public.expenses
  for insert with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'tr', 'ofs', 'ors', 'rds'])
  );

drop policy if exists "expenses_modify_authorized" on public.expenses;
create policy "expenses_modify_authorized" on public.expenses
  for update using (
    public.is_any_role(array['pr', 'vp', 'admin', 'rds'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'rds'])
  );

drop policy if exists "expenses_delete_authorized" on public.expenses;
create policy "expenses_delete_authorized" on public.expenses
  for delete using (
    public.is_any_role(array['pr', 'vp', 'admin', 'rds'])
  );

drop policy if exists "budgets_read_authorized" on public.budgets;
create policy "budgets_read_authorized" on public.budgets
  for select using (
    public.is_any_role(array['pr', 'vp', 'admin', 'cs', 'acs', 'rds'])
  );

drop policy if exists "budgets_write_authorized" on public.budgets;
create policy "budgets_write_authorized" on public.budgets
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'cs', 'acs', 'rds'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'cs', 'acs', 'rds'])
  );

-- ── Courses / Attendance (00005, 00012) ──────────────────────────────────────
drop policy if exists "courses_write_authorized" on public.course_schedules;
create policy "courses_write_authorized" on public.course_schedules
  for all using (
    public.is_any_role(array['cc', 'pr', 'vp', 'admin'])
  )
  with check (
    public.is_any_role(array['cc', 'pr', 'vp', 'admin'])
  );

drop policy if exists "attendance_write_authorized" on public.attendance;
create policy "attendance_write_authorized" on public.attendance
  for all using (
    public.is_any_role(array['cc', 'pr', 'vp', 'admin', 'gs', 'jgs'])
  )
  with check (
    public.is_any_role(array['cc', 'pr', 'vp', 'admin', 'gs', 'jgs'])
  );

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
  if not public.is_any_role(array['cc', 'pr', 'vp', 'admin', 'gs', 'jgs']) then
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

-- ── Donations + Sponsors + Config (00006) ────────────────────────────────────
drop policy if exists "donations_delete_admin" on public.donations;
create policy "donations_delete_admin" on public.donations
  for delete using (public.is_any_role(array['pr', 'vp', 'admin', 'tr']));

drop policy if exists "sponsors_manage_authorized" on public.sponsors;
create policy "sponsors_manage_authorized" on public.sponsors
  for all using (
    public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'tr'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'tr'])
  );

drop policy if exists "committee_write_admin" on public.committee_contacts;
create policy "committee_write_admin" on public.committee_contacts
  for all using (public.is_any_role(array['pr', 'vp', 'admin']))
  with check (public.is_any_role(array['pr', 'vp', 'admin']));

drop policy if exists "app_config_write_admin" on public.app_config;
create policy "app_config_write_admin" on public.app_config
  for all using (public.is_any_role(array['pr', 'vp', 'admin']))
  with check (public.is_any_role(array['pr', 'vp', 'admin']));

-- ── Storage: gallery bucket (00007) ──────────────────────────────────────────
drop policy if exists "gallery_storage_authorized_write" on storage.objects;
create policy "gallery_storage_authorized_write"
on storage.objects for insert
with check (
  bucket_id = 'gallery'
  and public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
);

drop policy if exists "gallery_storage_authorized_update" on storage.objects;
create policy "gallery_storage_authorized_update"
on storage.objects for update
using (
  bucket_id = 'gallery'
  and public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
)
with check (
  bucket_id = 'gallery'
  and public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
);

drop policy if exists "gallery_storage_delete_owner_or_admin" on storage.objects;
create policy "gallery_storage_delete_owner_or_admin"
on storage.objects for delete
using (
  bucket_id = 'gallery'
  and (
    owner = (select auth.uid())
    or public.is_any_role(array['pr', 'vp', 'admin'])
  )
);

-- ── Notifications: include admin in PR-level recipients (00017) ─────────────
create or replace function public.notify_sponsor_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_users_by_role(
    array['pr', 'vp', 'admin', 'gs', 'tr'],
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
    array['tr', 'pr', 'vp', 'admin'],
    'donation',
    'নতুন অনুদান এসেছে',
    format('"%s" থেকে নতুন অনুদান এসেছে।', coalesce(nullif(new.donor_name, ''), 'একজন দাতা')),
    jsonb_build_object('href', '/dashboard/dnt', 'donation_id', new.id)
  );
  return new;
end;
$$;
