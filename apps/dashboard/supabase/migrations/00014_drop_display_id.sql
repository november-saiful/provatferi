-- 00014_drop_display_id.sql
-- Drop display_id column and its unique index

DROP INDEX IF EXISTS profiles_display_id_key;
ALTER TABLE profiles DROP COLUMN IF EXISTS display_id;
