// Permission helpers — source of truth for UI visibility.
// The database RLS policies are the authoritative security layer; these helpers
// only hide/show UI affordances. Matches the ACL matrix in the planning doc.

import type { ModuleId, RoleId } from './types';

export const ROLE_NAMES: Record<RoleId, string> = {
  pr: 'সভাপতি',
  vp: 'সহ-সভাপতি',
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
  'pr',
  'vp',
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
  evf: ['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  glr: ['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  cln: ['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  ntb: ['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  dnt: ['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  spn: ['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  xpm: ['pr', 'vp', 'gs', 'tr', 'ofs', 'ors', 'rds'],
  bgm: ['pr', 'vp', 'cs', 'acs', 'rds'],
  rcd: ['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc'],
  cia: ['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  coi: ['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm', 'visitor'],
  admin: ['pr', 'vp']
};

// Per-module write access
export const MODULE_WRITE: Record<ModuleId, RoleSet> = {
  evf: ['pr', 'vp', 'gs', 'jgs', 'ofs', 'ors'],
  glr: ['pr', 'vp', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'],
  cln: ['pr', 'vp', 'gs', 'jgs', 'ofs', 'ors'],
  ntb: ['pr', 'vp', 'gs', 'jgs', 'ofs', 'ors'],
  dnt: ['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc', 'alm'],
  spn: ['pr', 'vp', 'gs', 'tr'],
  xpm: ['pr', 'vp', 'tr', 'ofs', 'ors', 'rds'],
  bgm: ['pr', 'vp', 'cs', 'acs', 'rds'],
  rcd: ['pr', 'vp', 'rds'],
  cia: ['pr', 'vp', 'gs', 'jgs', 'cc'],
  coi: [],
  admin: ['pr', 'vp']
};

export const SUPER_ADMINS: RoleSet = ['pr', 'vp'];

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
  return !!role && ['pr', 'vp', 'rds'].includes(role);
}

export function canEditBudget(role: RoleId | null | undefined): boolean {
  return !!role && ['pr', 'vp', 'cs', 'acs', 'rds'].includes(role);
}

export function canPinNotices(role: RoleId | null | undefined): boolean {
  return !!role && ['pr', 'vp'].includes(role);
}

export function canManageSponsors(role: RoleId | null | undefined): boolean {
  return !!role && ['pr', 'vp', 'gs', 'tr'].includes(role);
}

export function canManageAttendance(role: RoleId | null | undefined): boolean {
  return !!role && ['pr', 'vp', 'gs', 'jgs', 'cc'].includes(role);
}
