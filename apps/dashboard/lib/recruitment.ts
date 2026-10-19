/**
 * Shared recruitment rules — single source of truth for the registration form.
 *
 * Pure TypeScript, zero dependencies: imported by the dashboard page
 * (`app/recruitment/page.tsx`) AND by the edge Worker (`worker/index.ts`), so
 * client and server validation can never drift apart.
 */

export type FormMode = 'course' | 'member';

export interface RegistrationInput {
  name: string;
  address: string;
  phone: string;
  service: string;
  /** 'yes' | 'no' on the client; boolean after submit normalization. */
  isDuStudent: string | boolean;
  academicSession: string;
  department: string;
  hallName: string;
  duRegistrationId: string;
  paymentMethod: string;
  transactionId: string;
  formMode: FormMode | null | string;
}

/** Course options shown in the dropdown (value submitted to the backend). */
export const COURSES: Array<{ value: string; label: string }> = [
  { value: 'Flute', label: 'বাঁশি (Flute)' },
  { value: 'Guitar', label: 'গিটার (Guitar)' },
  { value: 'Violin', label: 'ভায়োলিন (Violin)' },
  { value: 'Vocal', label: 'কণ্ঠসঙ্গীত (Vocal)' },
  { value: 'Ukulele', label: 'ইউকুলেলে (Ukulele)' },
  { value: 'Dotara', label: 'দোতারা (Dotara)' },
];

/** Send-money numbers shown on the form. */
// NOTE: the Nagad number here (01842587676) differs from the dashboard's
// PAYMENT_METHODS constant (01839858853). Confirm with the treasurer which
// one is current before changing — this touches real money.
export const PAYMENT_NUMBERS: Record<'bkash' | 'nagad', string> = {
  bkash: '01407604000',
  nagad: '01842587676',
};

export const MEMBER_FEE = 100;
export const COURSE_FEE = 3000;
export const COURSE_FEE_DU = 2500;
export const FORM_FEE = 100;
export const FORM_FEE_DU = 50;

/** Total payable for a mode (+ DU discount). Must match the price summary UI. */
export function getFullAmount(formMode: FormMode | null | string, isDuStudent: boolean): number {
  if (formMode === 'member') return MEMBER_FEE;
  return isDuStudent ? COURSE_FEE_DU + FORM_FEE_DU : COURSE_FEE + FORM_FEE;
}

export function isDuStudentFlag(value: string | boolean): boolean {
  return value === true || value === 'yes';
}

function needsDuDetails(input: RegistrationInput): boolean {
  if (input.formMode === 'member') return true;
  return input.formMode === 'course' && isDuStudentFlag(input.isDuStudent);
}

/**
 * Field-level validation. Returns a map of field → Bengali error message
 * (empty = valid). Same shape the form renders inline; the Worker returns
 * the first message as a 400 error.
 */
export function validateRegistration(input: RegistrationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  if (!s(input.name)) errors.name = 'নাম আবশ্যক।';
  if (input.formMode === 'course' && !s(input.address)) {
    errors.address = 'ঠিকানা আবশ্যক।';
  }
  if (!s(input.phone)) {
    errors.phone = 'ফোন নম্বর আবশ্যক।';
  } else if (!/^[0-9+\-\s()]{10,15}$/.test(s(input.phone))) {
    errors.phone = 'সঠিক ফোন নম্বর লিখুন (১১ ডিজিট)।';
  }
  if (input.formMode === 'course' && !s(input.service)) {
    errors.service = 'একটি কোর্স সিলেক্ট করুন।';
  }
  if (!s(input.paymentMethod)) {
    errors.paymentMethod = 'পেমেন্ট মাধ্যম সিলেক্ট করুন।';
  }
  if (!s(input.transactionId)) {
    errors.transactionId = 'ট্রানজেকশন আইডি (TrxID) দিন।';
  }

  if (needsDuDetails(input)) {
    if (!s(input.academicSession)) errors.academicSession = 'শিক্ষাবর্ষ আবশ্যক।';
    if (!s(input.department)) errors.department = 'বিভাগের নাম আবশ্যক।';
    if (!s(input.hallName)) errors.hallName = 'হলের নাম আবশ্যক।';
    if (!s(input.duRegistrationId)) errors.duRegistrationId = 'রেজিস্ট্রেশন আইডি আবশ্যক।';
  }

  return errors;
}

const banglaDigits: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
};

export function toBanglaNum(n: number): string {
  return n.toLocaleString('en-US').replace(/\d/g, (d) => banglaDigits[d]);
}

// ── Recruitment phase (app_config: recruitment_enabled/_starts_at/_ends_at) ──

export interface RecruitmentSettings {
  enabled: boolean;
  /** ISO-8601 UTC, or null when unset. */
  startsAt: string | null;
  /** ISO-8601 UTC, or null when unset. */
  endsAt: string | null;
}

export const DEFAULT_RECRUITMENT_SETTINGS: RecruitmentSettings = {
  enabled: true,
  startsAt: null,
  endsAt: null
};

export type RecruitmentPhase = 'open' | 'scheduled' | 'ended' | 'disabled';

function validDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

export function parseRecruitmentSettings(
  rows: Array<{ key: string; value: string | null }> | null | undefined
): RecruitmentSettings {
  const map = new Map((rows ?? []).map((r) => [r.key, r.value ?? '']));
  if (map.size === 0) return DEFAULT_RECRUITMENT_SETTINGS;
  return {
    // Only an explicit 'false' disables the phase.
    enabled: (map.get('recruitment_enabled') ?? 'true').trim().toLowerCase() !== 'false',
    startsAt: validDate(map.get('recruitment_starts_at')),
    endsAt: validDate(map.get('recruitment_ends_at')),
  };
}

export function resolveRecruitmentPhase(
  settings: RecruitmentSettings,
  now: Date = new Date()
): RecruitmentPhase {
  if (!settings.enabled) return 'disabled';
  if (settings.startsAt && now.getTime() < Date.parse(settings.startsAt)) return 'scheduled';
  if (settings.endsAt && now.getTime() > Date.parse(settings.endsAt)) return 'ended';
  return 'open';
}

/** The deadline the UI should count down to for the current phase. */
export function phaseTarget(
  settings: RecruitmentSettings,
  phase: RecruitmentPhase
): string | null {
  if (phase === 'scheduled') return settings.startsAt;
  if (phase === 'open') return settings.endsAt;
  return null;
}

/** Convert an ISO timestamp to a value a datetime-local input accepts. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

/** Convert a datetime-local input value to an ISO timestamp ('' when empty). */
export function fromLocalInput(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}
