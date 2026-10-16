/**
 * Shared registration rules — single source of truth for the recruitment form.
 *
 * Pure TypeScript, zero dependencies: imported by the Next.js client
 * (`app/page.tsx`) AND by the edge Worker (`worker/index.ts`), so client and
 * server validation can never drift apart.
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
