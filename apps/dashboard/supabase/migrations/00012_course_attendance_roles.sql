-- 00012_course_attendance_roles.sql
-- Expand course attendance management to the roles that operate the instructor section.
-- PR and VP remain the administrator roles; GS and JGS are operational leaders.

 drop policy if exists "attendance_write_authorized" on public.attendance;
 create policy "attendance_write_authorized" on public.attendance
   for all using (
     public.is_any_role(array['cc', 'pr', 'vp', 'gs', 'jgs'])
   )
   with check (
     public.is_any_role(array['cc', 'pr', 'vp', 'gs', 'jgs'])
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
   if not public.is_any_role(array['cc', 'pr', 'vp', 'gs', 'jgs']) then
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
