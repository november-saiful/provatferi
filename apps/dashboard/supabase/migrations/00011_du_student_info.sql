-- 00011_du_student_info.sql
-- Add DU student-info fields to profiles, captured at registration.

alter table public.profiles
  add column if not exists academic_session text,
  add column if not exists department text,
  add column if not exists hall_name text,
  add column if not exists reg_id text;

-- Capture the new fields from signup metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role_id, full_name, phone, academic_session, department, hall_name, reg_id)
  values (
    new.id,
    new.email,
    'visitor',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'academic_session',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'hall_name',
    new.raw_user_meta_data->>'reg_id'
  );
  return new;
end;
$$ language plpgsql security definer;
