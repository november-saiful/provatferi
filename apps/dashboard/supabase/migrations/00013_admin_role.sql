-- 00013_admin_role.sql
-- Add admin role: PR-only assignment, single-admin constraint.

-- 1. Insert the admin role
insert into roles (id, name, display_order) values
  ('admin', 'Admin', 0)
on conflict (id) do update set name = excluded.name, display_order = excluded.display_order;

-- 2. Trigger function: enforce only ONE user can have role_id = 'admin' at any time
create or replace function public.enforce_single_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only enforce when someone is being assigned the admin role
  if new.role_id = 'admin' then
    -- Check if another user already holds the admin role
    if exists (
      select 1 from profiles
      where role_id = 'admin' and id != new.id
    ) then
      raise exception 'একজন মাত্র অ্যাডমিন থাকতে পারবে। প্রথমে বিদ্যমান অ্যাডমিনের ভূমিকা পরিবর্তন করুন।';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_single_admin on public.profiles;
create trigger enforce_single_admin
  before update on public.profiles
  for each row
  execute function public.enforce_single_admin();

-- 3. Trigger function: only PR can assign the admin role
create or replace function public.restrict_admin_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only enforce when someone is being assigned the admin role
  if new.role_id = 'admin' and old.role_id != 'admin' then
    -- Check if the current user is PR
    if not exists (
      select 1 from profiles
      where id = auth.uid() and role_id = 'pr'
    ) then
      raise exception 'শুধুমাত্র সভাপতি অ্যাডমিন নিয়োগ দিতে পারবেন।';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists restrict_admin_assignment on public.profiles;
create trigger restrict_admin_assignment
  before update on public.profiles
  for each row
  execute function public.restrict_admin_assignment();
