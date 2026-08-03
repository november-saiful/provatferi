-- 00016_drop_email_notifications.sql
-- Removes the Resend email notification system in favour of in-app notifications
-- (see 00017_inapp_notifications.sql).
--
-- Cleanup for databases that already applied 00007:
--   * drops the `records_log_notify` trigger + `notify_on_record_change()` function
--     that fed a database webhook / edge function
--   * drops the now-unused `records_log.notified` column
--
-- Manual steps (Supabase dashboard):
--   * delete the `send-notification` edge function (deleted from repo)
--   * remove the Database Webhook on `records_log` -> INSERT that pointed at it

drop trigger if exists records_log_notify on public.records_log;
drop function if exists public.notify_on_record_change();

alter table public.records_log drop column if exists notified;
