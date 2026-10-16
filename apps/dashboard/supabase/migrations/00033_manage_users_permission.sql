-- 00033_manage_users_permission.sql
-- Add manage_users permission to role_extra_permissions: controls which roles
-- can delete user accounts from the admin panel (the "মুছুন" action, invoked
-- through the user-admin edge function).
--
-- Seeded to match current behavior: root / pr / admin / vp are the roles the
-- edge function currently accepts, so they keep the ability by default. The
-- toggle is editable from Role Supervision like the other extra permissions.

ALTER TABLE role_extra_permissions
ADD COLUMN IF NOT EXISTS manage_users BOOLEAN DEFAULT false;

UPDATE role_extra_permissions
SET manage_users = true
WHERE role_id IN ('root', 'pr', 'vp', 'admin');

UPDATE role_extra_permissions
SET manage_users = false
WHERE role_id NOT IN ('root', 'pr', 'vp', 'admin');
