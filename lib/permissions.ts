// Permission helpers — source of truth for UI visibility.
// The database RLS policies are the authoritative security layer; these helpers
// only hide/show UI affordances. Matches the ACL matrix in the planning doc.

import type { ModuleId, RoleId } from './types';

export const ROLE_NAMES: Record<RoleId, string> = {
  root: 'রুট',
  pr: 'সভাপতি',
  vp: 'সহ-সভাপতি',
  admin: 'অ্যাডমিন',
  gs: 'সাধারণ সম্পাদক',
  jgs: 'যুগ্ম সাধারণ সম্পাদক',
  tr: 'কোষাধ্যক্ষ',
  ofs: 'অফিস সম্পাদক',
  ors: 'সাংগঠনিক সম্পাদক',
  cs: 'সাংস্কৃতিক সম্পাদক',
  acs: 'সহকারী সাংস্কৃতিক সম্পাদক',
  pps: 'প্রচার ও প্রকাশনা সম্পাদক',
  prs: 'জনসংযোগ সম্পাদক',
  rds: 'রেকর্ড ও ডকুমেন্টেশন সম্পাদক',
  cc: 'কোর্স কো-অর্ডিনেটর',
  alm: 'অ্যালামনাই',
  visitor: 'ভিজিটর'
};

export const ROLE_ORDER: RoleId[] = [
  'root',
  'pr',
  'vp',
  'admin',
  'gs',
  'jgs',
  'tr',
  'ofs',
  'ors',
  'cs',
  'acs',
  'pps',
  'prs',
  'rds',
  'cc',
  'alm'
];

type RoleSet = RoleId[];

// Per-module read access (from planning ACL matrix)
export const MODULE_READ: Record<ModuleId, RoleSet> = {
  evf: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  glr: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  cln: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  ntb: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  dnt: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  spn: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  xpm: ['root', 'pr', 'vp', 'admin', 'gs', 'tr', 'ofs', 'ors', 'rds'],
  bgm: ['root', 'pr', 'vp', 'admin', 'cs', 'acs', 'rds'],
  rcd: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc'],
  cia: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  coi: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  admin: ['root', 'pr', 'vp', 'admin']
};

// Per-module write access
export const MODULE_WRITE: Record<ModuleId, RoleSet> = {
  evf: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'ofs', 'ors'],
  glr: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'],
  cln: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'ofs', 'ors'],
  ntb: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'ofs', 'ors'],
  dnt: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm'],
  spn: ['root', 'pr', 'vp', 'admin', 'gs', 'tr'],
  xpm: ['root', 'pr', 'vp', 'admin', 'tr', 'ofs', 'ors', 'rds'],
  bgm: ['root', 'pr', 'vp', 'admin', 'cs', 'acs', 'rds'],
  rcd: ['root', 'pr', 'vp', 'admin', 'rds'],
  cia: ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'cc'],
  coi: [],
  admin: ['root', 'pr', 'vp', 'admin']
};

export const SUPER_ADMINS: RoleSet = ['root', 'pr', 'vp', 'admin'];

export function canRead(role: RoleId | null | undefined, module: ModuleId): boolean {
  if (!role) return false;
  return MODULE_READ[module].includes(role);
}

export function canWrite(role: RoleId | null | undefined, module: ModuleId): boolean {
  if (!role) return false;
  return MODULE_WRITE[module].includes(role);
}

export function isAdmin(role: RoleId | null | undefined): boolean {
  return !!role && SUPER_ADMINS.includes(role);
}

export function canEditExpense(role: RoleId | null | undefined): boolean {
  return !!role && ['root', 'pr', 'vp', 'admin', 'rds'].includes(role);
}

export function canEditBudget(role: RoleId | null | undefined): boolean {
  return !!role && ['root', 'pr', 'vp', 'admin', 'cs', 'acs', 'rds'].includes(role);
}

export function canPinNotices(role: RoleId | null | undefined): boolean {
  return !!role && ['root', 'pr', 'vp', 'admin'].includes(role);
}

export function canManageSponsors(role: RoleId | null | undefined): boolean {
  return !!role && ['root', 'pr', 'vp', 'admin', 'gs', 'tr'].includes(role);
}

export function canManageDonations(role: RoleId | null | undefined): boolean {
  return !!role && ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'tr'].includes(role);
}

export function canManageAttendance(role: RoleId | null | undefined): boolean {
  return !!role && ['root', 'pr', 'vp', 'admin', 'gs', 'jgs', 'cc'].includes(role);
}

/** Legacy hardcoded list for who may delete users; superseded by the
 * role_extra_permissions.manage_users toggle editable in Role Supervision. */
export function canManageUsers(role: RoleId | null | undefined): boolean {
  return !!role && ['root', 'pr', 'vp', 'admin'].includes(role);
}

/** Edit payment/contact phone numbers displayed on public pages. */
export function canEditPaymentNumbers(role: RoleId | null | undefined): boolean {
  return !!role && ['root', 'pr', 'admin'].includes(role);
}

/**
 * Committee members: every role except alumni and visitors.
 * Root is included as the organization itself — not a person but the club entity.
 * Source of truth — see committee-members-reference.md.
 */
export const COMMITTEE_ROLES: RoleSet = ROLE_ORDER.filter((r) => r !== 'alm' && r !== 'visitor');

export function isCommitteeMember(role: RoleId | null | undefined): boolean {
  return !!role && COMMITTEE_ROLES.includes(role);
}

/** Root is the organization itself, not a person. */
export function isOrganizationRole(role: RoleId | null | undefined): boolean {
  return role === 'root';
}
