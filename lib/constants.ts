import type { CalendarCategory, CourseType } from './types';

export const COURSES: Record<
  CourseType,
  { label: string; short: string; color: string; gradient: string }
> = {
  violin: {
    label: 'Violin',
    short: 'VL',
    color: '#93452A',
    gradient: 'from-coffee-600 to-coffee-400'
  },
  guitar: {
    label: 'Guitar',
    short: 'GT',
    color: '#8D6E63',
    gradient: 'from-taupe-600 to-taupe-400'
  },
  'ukulele-western': {
    label: 'Ukulele (Western)',
    short: 'UW',
    color: '#D4A017',
    gradient: 'from-amber-600 to-amber-400'
  },
  'ukulele-dotara': {
    label: 'Ukulele (Dotara)',
    short: 'UD',
    color: '#4E7C5C',
    gradient: 'from-sage-600 to-sage-400'
  },
  vocal: {
    label: 'Vocal',
    short: 'VC',
    color: '#C62828',
    gradient: 'from-warmred-600 to-warmred-400'
  },
  flute: {
    label: 'Flute',
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
  general: { label: 'General', color: '#8D6E63' },
  meeting: { label: 'Meeting', color: '#93452A' },
  event: { label: 'Event / Program', color: '#4E7C5C' },
  emergency: { label: 'Emergency', color: '#C62828' },
  custom: { label: 'Custom', color: '#D4A017' }
};

export const EXPENSE_CATEGORIES = [
  'Venue',
  'Equipment',
  'Transport',
  'Food',
  'Marketing',
  'Miscellaneous'
];

export const BUDGET_STATUSES = ['active', 'completed', 'cancelled'];

export const SPONSOR_STATUSES = ['pending', 'approved', 'rejected'];

export const SITE_NAME = 'Provatferi';
