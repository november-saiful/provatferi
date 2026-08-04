-- 00023_event_rsvp_notify.sql
-- Notify the event creator in-app when someone RSVPs to their event, following
-- the 00017 trigger patterns. Also adds a `mute_event_rsvp` preference flag
-- (00019-style) so hosts can opt out of this category entirely.

-- ── 1. New preference column (default = notifications on) ────────────────
alter table public.user_notification_settings
  add column if not exists mute_event_rsvp boolean not null default false;

-- ── 2. Honour the flag in the mute lookup ────────────────────────────────
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
        else false
      end
      from public.user_notification_settings s
      where s.user_id = p_user_id
    ),
    false
  );
$$;

-- ── 3. Trigger: new RSVP → event creator ─────────────────────────────────
-- Fires only on INSERT (upserts for an existing row and DELETEs are silent),
-- so hosts hear about each new attendee, not about status changes they
-- already know about. The creator's own RSVP is skipped.
create or replace function public.notify_event_rsvp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_title text;
  v_event_creator uuid;
  v_attendee_name text;
  v_status_label text;
begin
  select title, created_by into v_event_title, v_event_creator
  from public.events
  where id = new.event_id;

  -- No creator, or the creator RSVP'd to their own event — nothing to notify.
  if v_event_creator is null or v_event_creator = new.user_id then
    return new;
  end if;

  select full_name into v_attendee_name from public.profiles where id = new.user_id;

  v_status_label := case new.status
    when 'going' then 'যাচ্ছেন'
    when 'interested' then 'আগ্রহী'
  end;

  perform public.notify_user(
    v_event_creator,
    'event_rsvp',
    'নতুন RSVP',
    format(
      '%s %s আপনার ইভেন্ট "%s"-এ।',
      coalesce(v_attendee_name, 'একজন সদস্য'),
      coalesce(v_status_label, 'RSVP করেছেন'),
      coalesce(v_event_title, 'ইভেন্ট')
    ),
    jsonb_build_object('href', '/dashboard/evf/item?id=' || new.event_id, 'event_id', new.event_id)
  );

  return new;
end;
$$;

drop trigger if exists event_rsvps_notify_inapp on public.event_rsvps;
create trigger event_rsvps_notify_inapp
  after insert on public.event_rsvps
  for each row execute function public.notify_event_rsvp();
