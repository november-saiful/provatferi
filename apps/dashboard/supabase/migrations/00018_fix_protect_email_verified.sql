-- 00018_fix_protect_email_verified.sql
-- Fixes the `protect_email_verified` trigger added in 00015.
--
-- Problem: the original trigger raised an exception for ANY change to
-- `profiles.email_verified` unless the acting user was pr/vp/admin. But
-- `auth.uid()` is NULL whenever Supabase itself confirms an email (OTP
-- verify, confirmation-link click, admin `createUser(email_confirm: true)`
-- via the service-role key), because those flows run `sync_email_verified()`
-- as a SECURITY DEFINER trigger with no JWT `sub` claim. That made every
-- system-driven confirmation fail with HTTP 500 / "শুধুমাত্র কমিটি সদস্যরা
-- ইমেইল ভেরিফিকেশন স্ট্যাটাস পরিবর্তন করতে পারবেন।" — breaking real
-- signups and admin user provisioning alike.
--
-- Fix: only block AUTHENTICATED non-committee members (the original intent:
-- a member must not be able to self-mark verified through the owner-update
-- RLS policy). NULL `auth.uid()` = system/trigger/service-role context →
-- always allowed. RLS still prevents anonymous writes entirely.

create or replace function public.protect_email_verified()
returns trigger as $$
begin
  if new.email_verified is distinct from old.email_verified then
    -- auth.uid() is null in trigger/service-role contexts: allow system flows
    if auth.uid() is not null and not public.is_any_role(array['pr', 'vp', 'admin']) then
      raise exception 'শুধুমাত্র কমিটি সদস্যরা ইমেইল ভেরিফিকেশন স্ট্যাটাস পরিবর্তন করতে পারবেন।';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Recreate the trigger so the new definition is bound (idempotent).
drop trigger if exists protect_email_verified on public.profiles;
create trigger protect_email_verified
  before update on public.profiles
  for each row
  execute function public.protect_email_verified();
