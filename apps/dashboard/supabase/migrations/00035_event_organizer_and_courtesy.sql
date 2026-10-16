-- 00035_event_organizer_and_courtesy.sql
-- Events: selectable organizer (আয়োজক) + courtesy line (সৌজন্যে).
--
-- The "আয়োজনে …" attribution previously always pointed at the publisher
-- (created_by). organizer_id lets the publisher credit whoever actually
-- organized the event, and courtesy is an optional free-text line
-- (a person or organization the event is held courtesy of).

alter table public.events add column if not exists organizer_id uuid;
alter table public.events add column if not exists courtesy text;

-- Named constraint so PostgREST embeds can disambiguate the two profiles FKs
-- (events_created_by_fkey vs events_organizer_id_fkey).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_organizer_id_fkey') then
    alter table public.events
      add constraint events_organizer_id_fkey
      foreign key (organizer_id) references public.profiles(id);
  end if;
end $$;

create index if not exists events_organizer_id_idx on public.events (organizer_id);
