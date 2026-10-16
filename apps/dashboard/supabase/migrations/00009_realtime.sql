-- 00009_realtime.sql
-- Enable Supabase Realtime for the public-facing tables the site subscribes to.
-- Idempotent: skips tables that are already members of the publication.
-- Requires this migration to be applied to the Supabase project; then the client
-- uses postgres_changes subscriptions to refresh React Query caches instantly.

do $$
declare
  t text;
begin
  foreach t in array array[
    'public.events',
    'public.event_comments',
    'public.gallery_items',
    'public.calendar_events',
    'public.notices',
    'public.donations',
    'public.sponsors'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table %s', t);
    exception
      when duplicate_object then null; -- already a member
      when undefined_table then raise warning 'realtime: table % does not exist', t;
    end;
  end loop;
end;
$$;
