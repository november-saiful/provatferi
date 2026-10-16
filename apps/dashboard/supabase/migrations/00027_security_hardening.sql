-- 00027_security_hardening.sql
-- Resolves the Supabase database-linter findings (security category):
--
--   0010 security_definer_view        → donor_board / club_balance become
--                                      SECURITY DEFINER RPC functions (the
--                                      sanctioned pattern for RLS-bypassing
--                                      aggregates) and the views are dropped.
--   0011 function_search_path_mutable → add `set search_path = public` to the
--                                      5 flagged functions.
--   0013 rls_disabled_in_public       → enable RLS on public.roles.
--   0025 public_bucket_allows_listing → drop broad SELECT (listing) policies on
--                                      the gallery/profiles buckets; objects
--                                      are served via public URLs, not listing.
--   0028/0029 anon/authenticated can execute SECURITY DEFINER functions
--                                      → revoke EXECUTE from client roles on
--                                      trigger-only functions (triggers fire
--                                      as the table owner, so EXECUTE is not
--                                      required).
--
-- Intentional (documented) remaining findings:
--   * is_role / is_any_role          — required by RLS policy expressions.
--   * upsert_attendance              — called by the client via RPC.
--   * get_donor_board / get_club_balance — the new RPCs (public / authenticated).
--   * donations_insert_public / sponsors_insert_public — public submission forms.
--   * Leaked-password protection     — an Auth dashboard setting, not SQL.

-- ── 0013: enable RLS on roles ───────────────────────────────────────────────
alter table public.roles enable row level security;

drop policy if exists "roles_read_public" on public.roles;
create policy "roles_read_public" on public.roles
  for select using (true);

-- ── 0011: set search_path on the flagged functions ─────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role_id, full_name, phone, academic_session, department, hall_name, reg_id, email_verified)
  values (
    new.id,
    new.email,
    'visitor',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'academic_session',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'hall_name',
    new.raw_user_meta_data->>'reg_id',
    new.email_confirmed_at is not null
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.sync_email_verified()
returns trigger as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles set email_verified = true where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.sync_budget_spent_amount()
returns trigger as $$
declare
  v_budget_id uuid;
begin
  v_budget_id := case
    when TG_OP = 'DELETE' then OLD.budget_id
    else NEW.budget_id
  end;

  if v_budget_id is not null then
    update public.budgets b
    set spent_amount = coalesce((
      select sum(e.amount) from public.expenses e
      where e.budget_id = b.id
    ), 0),
    updated_at = now()
    where b.id = v_budget_id;
  end if;

  if TG_OP = 'UPDATE' and OLD.budget_id is distinct from NEW.budget_id and OLD.budget_id is not null then
    update public.budgets b
    set spent_amount = coalesce((
      select sum(e.amount) from public.expenses e
      where e.budget_id = b.id
    ), 0),
    updated_at = now()
    where b.id = OLD.budget_id;
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.log_record_change()
returns trigger as $$
declare
  v_original_creator uuid;
  v_modifier uuid := auth.uid();
begin
  if TG_OP = 'UPDATE' then
    v_original_creator := coalesce(OLD.created_by, v_modifier);

    insert into records_log (table_name, record_id, action, original_data, new_data, modified_by, original_creator)
    values (
      TG_TABLE_NAME::record_table,
      OLD.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      v_modifier,
      v_original_creator
    );

    return NEW;
  elsif TG_OP = 'DELETE' then
    v_original_creator := coalesce(OLD.created_by, v_modifier);

    insert into records_log (table_name, record_id, action, original_data, modified_by, original_creator)
    values (
      TG_TABLE_NAME::record_table,
      OLD.id,
      'delete',
      to_jsonb(OLD),
      v_modifier,
      v_original_creator
    );

    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

-- ── 0010: convert flagged views to SECURITY DEFINER RPC functions ──────────
-- Public donor board: names + messages only (no amounts/emails).
create or replace function public.get_donor_board()
returns table (
  id uuid,
  donor_name text,
  message text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, donor_name, message, created_at
  from public.donations
  where show_on_board = true and is_anonymous = false
  order by created_at desc;
$$;

drop view if exists public.donor_board;

revoke execute on function public.get_donor_board() from public;
grant execute on function public.get_donor_board() to anon, authenticated;

-- Universal club balance: identical totals for every signed-in user.
create or replace function public.get_club_balance()
returns table (
  allocated numeric,
  spent numeric
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce((select sum(allocated_amount) from public.budgets where status = 'active'), 0)::numeric(14,2) as allocated,
    coalesce((select sum(amount) from public.expenses), 0)::numeric(14,2) as spent;
$$;

drop view if exists public.club_balance;

revoke execute on function public.get_club_balance() from public;
grant execute on function public.get_club_balance() to authenticated;

-- ── 0025: public buckets no longer allow listing ────────────────────────────
-- Objects are served through their public URLs (bucket.public = true), so the
-- broad SELECT policies are not needed and would let clients list every file.
drop policy if exists "gallery_storage_public_read" on storage.objects;
drop policy if exists "profiles_storage_public_read" on storage.objects;

-- ── 0028/0029: hide trigger-only SECURITY DEFINER functions from the API ───
-- Trigger functions fire as the table owner; clients must not be able to call
-- them via /rest/v1/rpc. EXECUTE for the invoking role is not required.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.sync_email_verified() from public;
revoke execute on function public.sync_budget_spent_amount() from public;
revoke execute on function public.log_record_change() from public;
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.protect_email_verified() from public;
revoke execute on function public.enforce_single_admin() from public;
revoke execute on function public.restrict_admin_assignment() from public;
revoke execute on function public.notify_record_change() from public;
revoke execute on function public.notify_sponsor_inquiry() from public;
revoke execute on function public.notify_donation_received() from public;
revoke execute on function public.notify_role_changed() from public;
revoke execute on function public.notify_event_comment() from public;
revoke execute on function public.notify_event_rsvp() from public;
revoke execute on function public.notify_user(uuid, text, text, text, jsonb) from public;
revoke execute on function public.notify_users_by_role(text[], text, text, text, jsonb) from public;
revoke execute on function public.is_notification_muted(uuid, text) from public;
