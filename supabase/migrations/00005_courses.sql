-- 00005_courses.sql
-- Course Instructor Attendance (cia) — course_schedules + attendance

create type if not exists public.course_type as enum ('violin', 'guitar', 'ukulele-western', 'ukulele-dotara', 'vocal', 'flute');

create table if not exists public.course_schedules (
  id uuid primary key default gen_random_uuid(),
  course course_type not null,
  instructor_id uuid references profiles(id),
  total_classes int default 16 check (total_classes between 1 and 60),
  start_date date,
  status text default 'active'
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  course_schedule_id uuid references course_schedules(id) on delete cascade,
  class_day int not null check (class_day between 1 and 60),
  arrival_time time,
  exit_time time,
  note text,
  is_present boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique(course_schedule_id, class_day)
);

alter table public.course_schedules enable row level security;
alter table public.attendance enable row level security;

-- Public read
drop policy if exists "courses_read_public" on public.course_schedules;
create policy "courses_read_public" on public.course_schedules for select using (true);

drop policy if exists "attendance_read_public" on public.attendance;
create policy "attendance_read_public" on public.attendance for select using (true);

-- Write: CC, PR, VP
drop policy if exists "courses_write_authorized" on public.course_schedules;
create policy "courses_write_authorized" on public.course_schedules
  for all using (
    public.is_any_role(array['cc', 'pr', 'vp'])
  )
  with check (
    public.is_any_role(array['cc', 'pr', 'vp'])
  );

drop policy if exists "attendance_write_authorized" on public.attendance;
create policy "attendance_write_authorized" on public.attendance
  for all using (
    public.is_any_role(array['cc', 'pr', 'vp'])
  )
  with check (
    public.is_any_role(array['cc', 'pr', 'vp'])
  );

-- Attendance upsert helper used by the management UI.
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
  if not public.is_any_role(array['cc', 'pr', 'vp']) then
    raise exception 'not authorized';
  end if;

  insert into attendance (course_schedule_id, class_day, arrival_time, exit_time, note, is_present, created_by)
  values (p_course_schedule_id, p_class_day, p_arrival_time, p_exit_time, p_note, p_is_present, auth.uid())
  on conflict (course_schedule_id, class_day)
  do update set
    arrival_time = excluded.arrival_time,
    exit_time = excluded.exit_time,
    note = excluded.note,
    is_present = excluded.is_present
  returning *;

  return query select * from attendance where course_schedule_id = p_course_schedule_id and class_day = p_class_day;
end;
$$;
