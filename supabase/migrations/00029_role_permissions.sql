-- Role permissions table for dynamic permission management
-- Stores read/write access for each role per module, plus extra capabilities

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, module_id)
);

-- Extra capabilities for each role
CREATE TABLE IF NOT EXISTS role_extra_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id TEXT NOT NULL UNIQUE,
  pin_notices BOOLEAN DEFAULT false,
  edit_expense BOOLEAN DEFAULT false,
  edit_budget BOOLEAN DEFAULT false,
  manage_sponsors BOOLEAN DEFAULT false,
  manage_attendance BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_extra_permissions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read permissions
CREATE POLICY "Anyone can read role permissions" ON role_permissions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read extra permissions" ON role_extra_permissions
  FOR SELECT USING (true);

-- Only admins/roots can modify permissions
CREATE POLICY "Admins can insert role permissions" ON role_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role_id IN ('root', 'pr', 'admin')
    )
  );

CREATE POLICY "Admins can update role permissions" ON role_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role_id IN ('root', 'pr', 'admin')
    )
  );

CREATE POLICY "Admins can delete role permissions" ON role_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role_id IN ('root', 'pr', 'admin')
    )
  );

-- Only admins/roots can modify extra permissions
CREATE POLICY "Admins can insert extra permissions" ON role_extra_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role_id IN ('root', 'pr', 'admin')
    )
  );

CREATE POLICY "Admins can update extra permissions" ON role_extra_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role_id IN ('root', 'pr', 'admin')
    )
  );

CREATE POLICY "Admins can delete extra permissions" ON role_extra_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role_id IN ('root', 'pr', 'admin')
    )
  );

-- Seed default permissions from the hardcoded values
-- Module read permissions
INSERT INTO role_permissions (role_id, module_id, can_read, can_write) VALUES
-- evf (events)
('root', 'evf', true, true), ('pr', 'evf', true, true), ('vp', 'evf', true, true), ('admin', 'evf', true, true),
('gs', 'evf', true, true), ('jgs', 'evf', true, true), ('ofs', 'evf', true, true), ('ors', 'evf', true, true),
('tr', 'evf', true, false), ('cs', 'evf', true, false), ('acs', 'evf', true, false), ('pps', 'evf', true, false),
('prs', 'evf', true, false), ('rds', 'evf', true, false), ('cc', 'evf', true, false), ('alm', 'evf', true, false),
('visitor', 'evf', true, false),
-- glr (gallery)
('root', 'glr', true, true), ('pr', 'glr', true, true), ('vp', 'glr', true, true), ('admin', 'glr', true, true),
('gs', 'glr', true, true), ('jgs', 'glr', true, true), ('pps', 'glr', true, true), ('prs', 'glr', true, true),
('ofs', 'glr', true, true), ('ors', 'glr', true, true),
('tr', 'glr', true, false), ('cs', 'glr', true, false), ('acs', 'glr', true, false),
('rds', 'glr', true, false), ('cc', 'glr', true, false), ('alm', 'glr', true, false),
('visitor', 'glr', true, false),
-- cln (calendar)
('root', 'cln', true, true), ('pr', 'cln', true, true), ('vp', 'cln', true, true), ('admin', 'cln', true, true),
('gs', 'cln', true, true), ('jgs', 'cln', true, true), ('ofs', 'cln', true, true), ('ors', 'cln', true, true),
('tr', 'cln', true, false), ('cs', 'cln', true, false), ('acs', 'cln', true, false), ('pps', 'cln', true, false),
('prs', 'cln', true, false), ('rds', 'cln', true, false), ('cc', 'cln', true, false), ('alm', 'cln', true, false),
('visitor', 'cln', true, false),
-- ntb (notices)
('root', 'ntb', true, true), ('pr', 'ntb', true, true), ('vp', 'ntb', true, true), ('admin', 'ntb', true, true),
('gs', 'ntb', true, true), ('jgs', 'ntb', true, true), ('ofs', 'ntb', true, true), ('ors', 'ntb', true, true),
('tr', 'ntb', true, false), ('cs', 'ntb', true, false), ('acs', 'ntb', true, false), ('pps', 'ntb', true, false),
('prs', 'ntb', true, false), ('rds', 'ntb', true, false), ('cc', 'ntb', true, false), ('alm', 'ntb', true, false),
('visitor', 'ntb', true, false),
-- dnt (donations)
('root', 'dnt', true, true), ('pr', 'dnt', true, true), ('vp', 'dnt', true, true), ('admin', 'dnt', true, true),
('gs', 'dnt', true, true), ('jgs', 'dnt', true, true), ('tr', 'dnt', true, true), ('ofs', 'dnt', true, true),
('ors', 'dnt', true, true), ('cs', 'dnt', true, true), ('acs', 'dnt', true, true), ('pps', 'dnt', true, true),
('prs', 'dnt', true, true), ('rds', 'dnt', true, true), ('cc', 'dnt', true, true), ('alm', 'dnt', true, true),
('visitor', 'dnt', true, false),
-- spn (sponsors)
('root', 'spn', true, true), ('pr', 'spn', true, true), ('vp', 'spn', true, true), ('admin', 'spn', true, true),
('gs', 'spn', true, true), ('tr', 'spn', true, true),
('jgs', 'spn', true, false), ('ofs', 'spn', true, false), ('ors', 'spn', true, false), ('cs', 'spn', true, false),
('acs', 'spn', true, false), ('pps', 'spn', true, false), ('prs', 'spn', true, false), ('rds', 'spn', true, false),
('cc', 'spn', true, false), ('alm', 'spn', true, false), ('visitor', 'spn', true, false),
-- xpm (expenses)
('root', 'xpm', true, true), ('pr', 'xpm', true, true), ('vp', 'xpm', true, true), ('admin', 'xpm', true, true),
('tr', 'xpm', true, true), ('ofs', 'xpm', true, true), ('ors', 'xpm', true, true), ('rds', 'xpm', true, true),
('gs', 'xpm', true, false),
('cs', 'xpm', true, false), ('acs', 'xpm', true, false), ('pps', 'xpm', true, false), ('prs', 'xpm', true, false),
('cc', 'xpm', true, false), ('alm', 'xpm', true, false),
-- bgm (budget)
('root', 'bgm', true, true), ('pr', 'bgm', true, true), ('vp', 'bgm', true, true), ('admin', 'bgm', true, true),
('cs', 'bgm', true, true), ('acs', 'bgm', true, true), ('rds', 'bgm', true, true),
('gs', 'bgm', true, false), ('tr', 'bgm', true, false), ('ofs', 'bgm', true, false), ('ors', 'bgm', true, false),
('pps', 'bgm', true, false), ('prs', 'bgm', true, false), ('cc', 'bgm', true, false), ('alm', 'bgm', true, false),
-- rcd (records)
('root', 'rcd', true, true), ('pr', 'rcd', true, true), ('vp', 'rcd', true, true), ('admin', 'rcd', true, true),
('rds', 'rcd', true, true),
('gs', 'rcd', true, false), ('jgs', 'rcd', true, false), ('tr', 'rcd', true, false), ('ofs', 'rcd', true, false),
('ors', 'rcd', true, false), ('cs', 'rcd', true, false), ('acs', 'rcd', true, false), ('pps', 'rcd', true, false),
('prs', 'rcd', true, false), ('cc', 'rcd', true, false),
-- cia (attendance)
('root', 'cia', true, true), ('pr', 'cia', true, true), ('vp', 'cia', true, true), ('admin', 'cia', true, true),
('gs', 'cia', true, true), ('jgs', 'cia', true, true), ('cc', 'cia', true, true),
('tr', 'cia', true, false), ('ofs', 'cia', true, false), ('ors', 'cia', true, false), ('cs', 'cia', true, false),
('acs', 'cia', true, false), ('pps', 'cia', true, false), ('prs', 'cia', true, false), ('rds', 'cia', true, false),
('alm', 'cia', true, false), ('visitor', 'cia', true, false),
-- coi (insights)
('root', 'coi', true, false), ('pr', 'coi', true, false), ('vp', 'coi', true, false), ('admin', 'coi', true, false),
('gs', 'coi', true, false), ('jgs', 'coi', true, false), ('tr', 'coi', true, false), ('ofs', 'coi', true, false),
('ors', 'coi', true, false), ('cs', 'coi', true, false), ('acs', 'coi', true, false), ('pps', 'coi', true, false),
('prs', 'coi', true, false), ('rds', 'coi', true, false), ('cc', 'coi', true, false), ('alm', 'coi', true, false),
('visitor', 'coi', true, false),
-- admin
('root', 'admin', true, true), ('pr', 'admin', true, true), ('vp', 'admin', true, true), ('admin', 'admin', true, true)
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Seed extra permissions
INSERT INTO role_extra_permissions (role_id, pin_notices, edit_expense, edit_budget, manage_sponsors, manage_attendance) VALUES
('root', true, true, true, true, true),
('pr', true, true, true, true, true),
('vp', true, true, true, true, true),
('admin', true, true, true, true, true),
('gs', false, false, false, true, true),
('jgs', false, false, false, false, true),
('tr', false, false, false, true, false),
('ofs', false, false, false, false, false),
('ors', false, false, false, false, false),
('cs', false, false, true, false, false),
('acs', false, false, true, false, false),
('pps', false, false, false, false, false),
('prs', false, false, false, false, false),
('rds', false, true, true, false, false),
('cc', false, false, false, false, true),
('alm', false, false, false, false, false),
('visitor', false, false, false, false, false)
ON CONFLICT (role_id) DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION update_role_permissions_updated_at();

CREATE TRIGGER role_extra_permissions_updated_at
  BEFORE UPDATE ON role_extra_permissions
  FOR EACH ROW EXECUTE FUNCTION update_role_permissions_updated_at();
