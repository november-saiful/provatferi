import type { CalendarCategory, CourseType } from './types';

export const COURSES: Record<
  CourseType,
  { label: string; short: string; color: string; gradient: string }
> = {
  violin: {
    label: 'ভায়োলিন',
    short: 'VL',
    color: '#93452A',
    gradient: 'from-coffee-600 to-coffee-400'
  },
  guitar: {
    label: 'গিটার',
    short: 'GT',
    color: '#8D6E63',
    gradient: 'from-taupe-600 to-taupe-400'
  },
  'ukulele-western': {
    label: 'উকুলেলে (ওয়েস্টার্ন)',
    short: 'UW',
    color: '#D4A017',
    gradient: 'from-amber-600 to-amber-400'
  },
  'ukulele-dotara': {
    label: 'উকুলেলে (দোতারা)',
    short: 'UD',
    color: '#4E7C5C',
    gradient: 'from-sage-600 to-sage-400'
  },
  vocal: {
    label: 'কণ্ঠসংগীত',
    short: 'VC',
    color: '#C62828',
    gradient: 'from-warmred-600 to-warmred-400'
  },
  flute: {
    label: 'বাঁশি',
    short: 'FL',
    color: '#5C6BC0',
    gradient: 'from-indigo-500 to-blue-400'
  }
};

export const COURSE_ORDER: CourseType[] = [
  'violin',
  'guitar',
  'ukulele-western',
  'ukulele-dotara',
  'vocal',
  'flute'
];

export const CALENDAR_CATEGORIES: Record<
  CalendarCategory,
  { label: string; color: string }
> = {
  general: { label: 'সাধারণ', color: '#8D6E63' },
  meeting: { label: 'সভা', color: '#93452A' },
  event: { label: 'অনুষ্ঠান / প্রোগ্রাম', color: '#4E7C5C' },
  emergency: { label: 'জরুরি', color: '#C62828' },
  custom: { label: 'কাস্টম', color: '#D4A017' }
};

export const EXPENSE_CATEGORIES = [
  'স্থান',
  'যন্ত্রপাতি',
  'পরিবহন',
  'খাবার',
  'প্রচারণা',
  'বিবিধ'
];

export const BUDGET_STATUSES = ['active', 'completed', 'cancelled'];

export const SPONSOR_STATUSES = ['pending', 'approved', 'rejected'];

// Bengali labels for raw DB status values shown on badges/selects
export const EVENT_STATUS_LABELS: Record<string, string> = {
  upcoming: 'আসন্ন',
  ongoing: 'চলমান',
  past: 'সমাপ্ত'
};

export const SPONSOR_STATUS_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  approved: 'অনুমোদিত',
  rejected: 'প্রত্যাখ্যাত'
};

export const BUDGET_STATUS_LABELS: Record<string, string> = {
  active: 'সক্রিয়',
  completed: 'সম্পন্ন',
  cancelled: 'বাতিল'
};

export const COURSE_STATUS_LABELS: Record<string, string> = {
  active: 'সক্রিয়',
  completed: 'সম্পন্ন',
  cancelled: 'বাতিল'
};

export const ACTION_LABELS: Record<string, string> = {
  create: 'তৈরি',
  update: 'আপডেট',
  delete: 'মুছুন'
};

export const SITE_NAME = 'প্রভাতফেরী';
export const RECRUITMENT_URL = 'https://recruitment.provatferi2009.workers.dev/';

// Send-money wallet numbers shown on the donation/sponsor forms
// (see 00020_payment_fields.sql).
export const PAYMENT_METHODS: Record<
  'bkash' | 'nagad',
  { label: string; number: string }
> = {
  bkash: { label: 'বিকাশ (bKash)', number: '01407604000' },
  nagad: { label: 'নগদ (Nagad)', number: '01839858853' }
};

export type PaymentMethodId = keyof typeof PAYMENT_METHODS;
