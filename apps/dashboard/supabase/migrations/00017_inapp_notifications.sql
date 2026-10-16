-- 00017_inapp_notifications.sql
-- In-app notification system (replaces the removed Resend email system).
--
-- Creates the `notifications` table, RLS policies, helper functions and DB
-- triggers that generate per-user notifications for the spec §7.1 triggers:
--
--   | Trigger            | Recipient             | Type             |
--   |--------------------|-----------------------|------------------|
--   | Record edited      | Original creator      | record_edited    |
--   | Record deleted     | Original creator      | record_deleted   |
--   | New sponsor inquiry| pr, vp, gs, tr        | sponsor_inquiry  |
--   | New donation       | tr, pr, vp            | donation         |
--   | Role changed       | Affected user         | role_changed     |
--   | New comment        | Event creator         | event_comment    |
--
-- RLS: users can read/update/delete only their own rows; inserts happen only
-- through SECURITY DEFINER functions (triggers), never from the client.

-- ── Table ────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_read_idx
  on public.notifications (user_id, is_read);
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);

-- Client inserts are forbidden; only SECURITY DEFINER functions may write.
drop policy if exists "notifications_insert_system" on public.notifications;
create policy "notifications_insert_system" on public.notifications
  for insert with check (false);

-- ── Helper functions ─────────────────────────────────────────────────────
create or replace function public.notify_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;
  insert into public.notifications (user_id, type, title, body, data)
  values (p_user_id, p_type, p_title, p_body, coalesce(p_data, '{}'::jsonb));
end;
$$;

create or replace function public.notify_users_by_role(
  p_roles text[],
  p_type text,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, data)
  select id, p_type, p_title, p_body, coalesce(p_data, '{}'::jsonb)
  from public.profiles
  where role_id = any(p_roles)
    and is_active = true;
end;
$$;

-- ── Trigger: record edited / deleted → original creator ────────────────
create or replace function public.notify_record_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_modifier_name text;
  v_label text;
begin
  if new.action not in ('update', 'delete') then
    return new;
  end if;
  -- No creator, or the creator changed their own record — nothing to notify.
  if new.original_creator is null or new.modified_by = new.original_creator then
    return new;
  end if;

  select full_name into v_modifier_name from public.profiles where id = new.modified_by;

  v_label := case new.table_name::text
    when 'expenses' then 'ব্যয়'
    when 'budgets' then 'বাজেট'
    else new.table_name::text
  end;

  if new.action = 'update' then
    perform public.notify_user(
      new.original_creator,
      'record_edited',
      'রেকর্ড সম্পাদিত হয়েছে',
      format(
        'আপনার %s রেকর্ডটি %s দ্বারা %s তারিখে সম্পাদনা করা হয়েছে।',
        v_label,
        coalesce(v_modifier_name, 'একজন সদস্য'),
        to_char(new.created_at at time zone 'Asia/Dhaka', 'YYYY-MM-DD')
      ),
      jsonb_build_object('href', '/dashboard/rcd', 'table_name', new.table_name, 'record_id', new.record_id)
    );
  else
    perform public.notify_user(
      new.original_creator,
      'record_deleted',
      'রেকর্ড মুছে ফেলা হয়েছে',
      format('আপনার %s রেকর্ডটি %s দ্বারা মুছে ফেলা হয়েছে।', v_label, coalesce(v_modifier_name, 'একজন সদস্য')),
      jsonb_build_object('href', '/dashboard/rcd', 'table_name', new.table_name, 'record_id', new.record_id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists records_log_notify_inapp on public.records_log;
create trigger records_log_notify_inapp
  after insert on public.records_log
  for each row execute function public.notify_record_change();

-- ── Trigger: new sponsor inquiry → pr, vp, gs, tr ──────────────────────
create or replace function public.notify_sponsor_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_users_by_role(
    array['pr', 'vp', 'gs', 'tr'],
    'sponsor_inquiry',
    'নতুন স্পনসর ইনকোয়ারি',
    format('কোম্পানি "%s" থেকে নতুন স্পনসর ইনকোয়ারি এসেছে।', new.company_name),
    jsonb_build_object('href', '/dashboard/spn', 'sponsor_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists sponsors_notify_inapp on public.sponsors;
create trigger sponsors_notify_inapp
  after insert on public.sponsors
  for each row execute function public.notify_sponsor_inquiry();

-- ── Trigger: new donation → tr, pr, vp ─────────────────────────────────
create or replace function public.notify_donation_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_users_by_role(
    array['tr', 'pr', 'vp'],
    'donation',
    'নতুন অনুদান এসেছে',
    format('"%s" থেকে নতুন অনুদান এসেছে।', coalesce(nullif(new.donor_name, ''), 'একজন দাতা')),
    jsonb_build_object('href', '/dashboard/dnt', 'donation_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists donations_notify_inapp on public.donations;
create trigger donations_notify_inapp
  after insert on public.donations
  for each row execute function public.notify_donation_received();

-- ── Trigger: role changed → affected user ──────────────────────────────
create or replace function public.notify_role_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_name text;
  v_admin_name text;
begin
  if new.role_id is not distinct from old.role_id then
    return new;
  end if;
  -- A user cannot change their own role; guard anyway.
  if new.id = auth.uid() then
    return new;
  end if;

  select name into v_role_name from public.roles where id = new.role_id;
  select full_name into v_admin_name from public.profiles where id = auth.uid();

  perform public.notify_user(
    new.id,
    'role_changed',
    'আপনার ভূমিকা আপডেট হয়েছে',
    format(
      'আপনার ভূমিকা %s-এ আপডেট করা হয়েছে %s দ্বারা।',
      coalesce(v_role_name, new.role_id),
      coalesce(v_admin_name, 'অ্যাডমিন')
    ),
    jsonb_build_object('href', '/dashboard/profile')
  );

  return new;
end;
$$;

drop trigger if exists profiles_role_notify on public.profiles;
create trigger profiles_role_notify
  after update of role_id on public.profiles
  for each row execute function public.notify_role_changed();

-- ── Trigger: new comment on your event → event creator ────────────────
create or replace function public.notify_event_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_title text;
  v_event_creator uuid;
  v_author_name text;
begin
  select title, created_by into v_event_title, v_event_creator
  from public.events
  where id = new.event_id;

  if v_event_creator is null or v_event_creator = new.user_id then
    return new;
  end if;

  select full_name into v_author_name from public.profiles where id = new.user_id;

  perform public.notify_user(
    v_event_creator,
    'event_comment',
    'নতুন মন্তব্য',
    format(
      '%s আপনার ইভেন্ট "%s"-এ মন্তব্য করেছেন।',
      coalesce(v_author_name, 'একজন সদস্য'),
      coalesce(v_event_title, 'ইভেন্ট')
    ),
    jsonb_build_object('href', '/dashboard/evf/item?id=' || new.event_id, 'event_id', new.event_id)
  );

  return new;
end;
$$;

drop trigger if exists event_comments_notify_inapp on public.event_comments;
create trigger event_comments_notify_inapp
  after insert on public.event_comments
  for each row execute function public.notify_event_comment();

-- ── Realtime: let the bell badge update live ────────────────────────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.notifications;
  exception
    when duplicate_object then null; -- already a member
  end;
end;
$$;
