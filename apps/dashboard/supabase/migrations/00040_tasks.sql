-- 00040_tasks.sql
-- Task assignment table — admins/presidents assign tasks to members.

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  assigned_to  uuid references profiles(id) on delete set null,
  assignee_name text not null,
  task_date    date not null,
  start_time   time,
  end_time     time,
  perks        text,
  status       text not null default 'pending'
               check (status in ('pending', 'in_progress', 'completed')),
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Index for date-based lookups (the primary query pattern)
create index idx_tasks_date on public.tasks (task_date);

-- Updated_at trigger
create or replace function public.handle_task_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_task_updated_at();

-- RLS
alter table public.tasks enable row level security;

-- All signed-in users can read tasks
create policy "Tasks are readable by all authenticated users"
  on public.tasks for select
  to authenticated
  using (true);

-- Only root, pr, vp, admin can insert tasks
create policy "Admins can create tasks"
  on public.tasks for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role_id in ('root', 'pr', 'vp', 'admin')
    )
  );

-- Only root, pr, vp, admin can update tasks
create policy "Admins can update tasks"
  on public.tasks for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role_id in ('root', 'pr', 'vp', 'admin')
    )
  );

-- Only root, pr, vp, admin can delete tasks
create policy "Admins can delete tasks"
  on public.tasks for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role_id in ('root', 'pr', 'vp', 'admin')
    )
  );

-- ── Notifications: task_assigned ──────────────────────────────────────
-- Add mute preference column (same pattern as 00023_event_rsvp_notify.sql)
alter table public.user_notification_settings
  add column if not exists mute_task_assigned boolean not null default false;

-- Honour the flag in the mute lookup
create or replace function public.is_notification_muted(p_user_id uuid, p_type text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case p_type
        when 'record_edited'   then s.mute_record_change
        when 'record_deleted'  then s.mute_record_change
        when 'sponsor_inquiry' then s.mute_sponsor_inquiry
        when 'donation'        then s.mute_donation
        when 'role_changed'    then s.mute_role_change
        when 'event_comment'   then s.mute_event_comment
        when 'event_rsvp'      then s.mute_event_rsvp
        when 'task_assigned'   then s.mute_task_assigned
        else false
      end
      from public.user_notification_settings s
      where s.user_id = p_user_id
    ),
    false
  );
$$;

-- Trigger: new task assigned → notify the assigned user
create or replace function public.notify_task_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assigner_name text;
begin
  -- Only notify when assigned_to is a real user (not a custom name)
  if new.assigned_to is null then
    return new;
  end if;

  -- Don't notify yourself
  if new.assigned_to = new.created_by then
    return new;
  end if;

  select full_name into v_assigner_name from public.profiles where id = new.created_by;

  perform public.notify_user(
    new.assigned_to,
    'task_assigned',
    'আপনাকে একটি টাস্ক নির্ধারণ করা হয়েছে',
    format(
      '%s আপনাকে "%s" টাস্কটি %s তারিখে নির্ধারণ করেছেন।',
      coalesce(v_assigner_name, 'একজন অ্যাডমিন'),
      new.title,
      to_char(new.task_date, 'YYYY-MM-DD')
    ),
    jsonb_build_object('href', '/dashboard/task', 'task_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists tasks_notify_assigned on public.tasks;
create trigger tasks_notify_assigned
  after insert on public.tasks
  for each row execute function public.notify_task_assigned();

-- Enable realtime
alter publication supabase_realtime add table public.tasks;
