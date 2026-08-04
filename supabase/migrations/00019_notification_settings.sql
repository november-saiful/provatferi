-- 00019_notification_settings.sql
-- Per-user notification preferences.
--
-- Members can mute categories they don't want to hear about (spec: record
-- changes and role changes, plus sponsor/donation/comment for completeness).
-- Preferences live in `user_notification_settings` (one row per user, all
-- flags default false = everything on). The notification triggers from 00017
-- consult `is_notification_muted()` before inserting, so a muted category
-- never creates a row — the badge and toast naturally stay quiet.

-- ── Table ────────────────────────────────────────────────────────────────
create table if not exists public.user_notification_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  mute_record_change boolean not null default false,
  mute_role_change boolean not null default false,
  mute_sponsor_inquiry boolean not null default false,
  mute_donation boolean not null default false,
  mute_event_comment boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_notification_settings enable row level security;

-- Own-row only: a member reads, inserts and updates just their own row.
drop policy if exists "notification_settings_select_own" on public.user_notification_settings;
create policy "notification_settings_select_own" on public.user_notification_settings
  for select using (auth.uid() = user_id);

drop policy if exists "notification_settings_insert_own" on public.user_notification_settings;
create policy "notification_settings_insert_own" on public.user_notification_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "notification_settings_update_own" on public.user_notification_settings;
create policy "notification_settings_update_own" on public.user_notification_settings
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists notification_settings_set_updated_at on public.user_notification_settings;
create trigger notification_settings_set_updated_at
  before update on public.user_notification_settings
  for each row execute function public.set_updated_at();

-- ── Helper ────────────────────────────────────────────────────────────────
-- Returns true when `p_type` is muted for the user. No settings row (or an
-- unknown type) means "not muted" — the default is everything on.
create or replace function public.is_notification_muted(p_user_id uuid, p_type text)
returns boolean
language sql
security definer
set search_path = public
as $$
  -- Scalar subquery: a missing settings row yields NULL, which coalesce turns
  -- into false (default = everything on). This must NOT return NULL, because
  -- `not is_notification_muted(...)` in notify_users_by_role would then drop
  -- users without a settings row from role fan-out notifications.
  select coalesce(
    (
      select case p_type
        when 'record_edited'   then s.mute_record_change
        when 'record_deleted'  then s.mute_record_change
        when 'sponsor_inquiry' then s.mute_sponsor_inquiry
        when 'donation'        then s.mute_donation
        when 'role_changed'    then s.mute_role_change
        when 'event_comment'   then s.mute_event_comment
        else false
      end
      from public.user_notification_settings s
      where s.user_id = p_user_id
    ),
    false
  );
$$;

-- ── Respect preferences in the notifier helpers ──────────────────────────
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
  if public.is_notification_muted(p_user_id, p_type) then
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
  from public.profiles p
  where p.role_id = any(p_roles)
    and p.is_active = true
    and not public.is_notification_muted(p.id, p_type);
end;
$$;
