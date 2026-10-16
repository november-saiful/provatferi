-- 00036_event_coordinator.sql
-- Events: selectable coordinator (সংগঠক) — a committee member who coordinated
-- the event, credited alongside the organizer (আয়োজক) and courtesy (সৌজন্যে).

alter table public.events add column if not exists coordinator_id uuid;

-- Named constraint so PostgREST embeds can disambiguate the three profiles FKs
-- (events_created_by_fkey, events_organizer_id_fkey, events_coordinator_id_fkey).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_coordinator_id_fkey') then
    alter table public.events
      add constraint events_coordinator_id_fkey
      foreign key (coordinator_id) references public.profiles(id);
  end if;
end $$;

create index if not exists events_coordinator_id_idx on public.events (coordinator_id);
