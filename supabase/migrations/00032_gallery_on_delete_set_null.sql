-- 00032_gallery_on_delete_set_null.sql
-- Deleting an event fails when it has gallery photos: gallery_items.event_id
-- references events(id) with no ON DELETE action, so Postgres raises a foreign
-- key violation. Switch to ON DELETE SET NULL so event deletion succeeds and
-- the photos stay visible in the general gallery pool (event_id = NULL already
-- means "সাধারণ ছবি" in the gallery albums view) instead of being orphaned.
--
-- Event comments (00002) and RSVPs (00022) already cascade; gallery photos are
-- intentionally preserved because the gallery is its own public module.

alter table public.gallery_items
  drop constraint if exists gallery_items_event_id_fkey;

alter table public.gallery_items
  add constraint gallery_items_event_id_fkey
  foreign key (event_id) references public.events(id) on delete set null;
