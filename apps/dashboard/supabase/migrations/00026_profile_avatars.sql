-- 00026_profile_avatars.sql
-- Storage bucket for user profile avatars (uploaded from the profile page).
--
-- The profile page uploads avatars to a `profiles` bucket. Only the `gallery`
-- bucket existed before, so this migration creates `profiles` with public
-- reads and committee-only writes: only users holding a committee role
-- (everyone except visitors and alumni — see committee-members-reference.md)
-- may upload/change/delete avatars under their own `avatars/<user-id>/` folder.

insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do nothing;

-- Drop any previously-applied variants of these policies (an earlier draft
-- allowed ANY signed-in user to write) so the committee-only rules replace
-- them rather than stacking on top.
drop policy if exists "profiles_storage_public_read" on storage.objects;
drop policy if exists "profiles_storage_insert_own" on storage.objects;
drop policy if exists "profiles_storage_insert_committee" on storage.objects;
drop policy if exists "profiles_storage_update_own" on storage.objects;
drop policy if exists "profiles_storage_update_committee" on storage.objects;
drop policy if exists "profiles_storage_delete_own_or_admin" on storage.objects;
drop policy if exists "profiles_storage_delete_committee_or_admin" on storage.objects;

-- Public read (avatars render on the public contact page and shared components)
create policy "profiles_storage_public_read"
on storage.objects for select
using (bucket_id = 'profiles');

-- Writes are limited to committee members only (visitors/alumni cannot add a
-- profile picture). Uploads live at `avatars/<user-id>/...`, so the owner is
-- the SECOND folder segment.
create policy "profiles_storage_insert_committee"
on storage.objects for insert
with check (
  bucket_id = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc'])
);

create policy "profiles_storage_update_committee"
on storage.objects for update
using (
  bucket_id = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc'])
)
with check (
  bucket_id = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc'])
);

-- Owners (committee members only) may delete their own avatar; admins can
-- clean up any.
create policy "profiles_storage_delete_committee_or_admin"
on storage.objects for delete
using (
  bucket_id = 'profiles'
  and (
    (
      (storage.foldername(name))[2] = auth.uid()::text
      and public.is_any_role(array['pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc'])
    )
    or public.is_any_role(array['pr', 'vp', 'admin'])
  )
);
