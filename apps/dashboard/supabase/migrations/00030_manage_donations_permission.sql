-- Add manage_donations permission to role_extra_permissions table

-- Add the new column
ALTER TABLE role_extra_permissions 
ADD COLUMN IF NOT EXISTS manage_donations BOOLEAN DEFAULT false;

-- Update existing roles to have the permission based on the canManageDonations function
-- Roles: root, pr, vp, admin, gs, jgs, tr
UPDATE role_extra_permissions 
SET manage_donations = true 
WHERE role_id IN ('root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr');

UPDATE role_extra_permissions 
SET manage_donations = false 
WHERE role_id NOT IN ('root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr');
