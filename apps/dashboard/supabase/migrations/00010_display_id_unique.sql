-- 00010_display_id_unique.sql
-- The old display_id auto-suggestion bug could assign the same id twice (e.g.
-- two cc-2 rows). This migration repairs any leftovers and then locks
-- uniqueness in at the database level so no client logic can duplicate ids again.

-- 1) Renumber duplicates: keep the earliest row of each duplicate group and bump
--    the rest to the next free number for their role, preserving the role's
--    zero-padding style (cc-02 stays padded, cc-2 stays plain).
DO $$
DECLARE
  dup RECORD;
  role_prefix text;
  style_padded boolean;
  next_num integer;
  next_id text;
BEGIN
  FOR dup IN
    SELECT id, display_id,
           row_number() OVER (PARTITION BY display_id ORDER BY created_at, id) AS rn
    FROM profiles
    WHERE display_id IS NOT NULL
  LOOP
    IF dup.rn = 1 THEN
      CONTINUE; -- keep this row untouched
    END IF;

    role_prefix := split_part(dup.display_id, '-', 1);

    -- Does this role use zero-padded ids (cc-01) or plain (cc-1)?
    SELECT EXISTS (
      SELECT 1 FROM profiles
      WHERE display_id ~ ('^' || role_prefix || '-0\d+$')
    ) INTO style_padded;

    -- Next free number for this role (recomputed each pass so previously
    -- renumbered rows are never reused).
    SELECT COALESCE(MAX((regexp_match(display_id, '^[a-z]+-(\d+)$'))[1]::integer), 0) + 1
      INTO next_num
      FROM profiles
      WHERE display_id ~ ('^' || role_prefix || '-\d+$');

    next_id := role_prefix || '-' ||
      CASE WHEN style_padded THEN lpad(next_num::text, 2, '0') ELSE next_num::text END;

    UPDATE profiles SET display_id = next_id WHERE id = dup.id;
  END LOOP;
END $$;

-- 2) Lock it in: no two profiles may share a display_id from now on.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_id_key
  ON profiles (display_id)
  WHERE display_id IS NOT NULL;
