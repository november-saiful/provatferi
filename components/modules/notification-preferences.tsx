'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Pencil,
  UserCog,
  Handshake,
  Heart,
  MessageSquare,
  CalendarCheck,
  ListTodo,
  BellOff,
  type LucideIcon
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS
} from '@/lib/queries';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type MuteKey =
  | 'mute_record_change'
  | 'mute_role_change'
  | 'mute_sponsor_inquiry'
  | 'mute_donation'
  | 'mute_event_comment'
  | 'mute_event_rsvp'
  | 'mute_task_assigned';

interface PreferenceRow {
  key: MuteKey;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}

const ROWS: PreferenceRow[] = [
  {
    key: 'mute_record_change',
    label: 'রেকর্ড পরিবর্তন',
    description: 'আপনার ব্যয়/বাজেট রেকর্ড সম্পাদনা বা মুছে ফেলা হলে জানান',
    icon: Pencil,
    tone: 'bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-300'
  },
  {
    key: 'mute_role_change',
    label: 'ভূমিকা পরিবর্তন',
    description: 'আপনার কমিটি ভূমিকা আপডেট হলে জানান',
    icon: UserCog,
    tone: 'bg-coffee-100 text-coffee-700 dark:bg-coffee-900/50 dark:text-coffee-300'
  },
  {
    key: 'mute_sponsor_inquiry',
    label: 'স্পনসর ইনকোয়ারি',
    description: 'নতুন স্পনসর ইনকোয়ারি এলে জানান',
    icon: Handshake,
    tone: 'bg-gold-100 text-gold-700 dark:bg-gold-900/50 dark:text-gold-300'
  },
  {
    key: 'mute_donation',
    label: 'অনুদান',
    description: 'নতুন অনুদান এলে জানান',
    icon: Heart,
    tone: 'bg-warmred-100 text-warmred-700 dark:bg-warmred-900/50 dark:text-warmred-300'
  },
  {
    key: 'mute_event_comment',
    label: 'ইভেন্ট মন্তব্য',
    description: 'আপনার ইভেন্টে নতুন মন্তব্য এলে জানান',
    icon: MessageSquare,
    tone: 'bg-taupe-100 text-taupe-700 dark:bg-taupe-900/50 dark:text-taupe-300'
  },
  {
    key: 'mute_event_rsvp',
    label: 'ইভেন্ট অংশগ্রহণ',
    description: 'আপনার ইভেন্টে কেউ আগ্রহী/যাচ্ছে চিহ্নিত করলে জানান',
    icon: CalendarCheck,
    tone: 'bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-300'
  },
  {
    key: 'mute_task_assigned',
    label: 'টাস্ক নির্ধারণ',
    description: 'আপনাকে কোনো টাস্ক নির্ধারণ করলে জানান',
    icon: ListTodo,
    tone: 'bg-gold-100 text-gold-700 dark:bg-gold-900/50 dark:text-gold-300'
  }
];

/**
 * Per-category notification preferences (migration 00019). Each switch upserts
 * the user's `user_notification_settings` row; the DB triggers skip muted
 * categories so no notification is created in the first place.
 */
export function NotificationPreferences() {
  const { user } = useAuthStore();
  const { data: settings, isLoading } = useNotificationSettings(!!user);
  const update = useUpdateNotificationSettings();
  const [busyKey, setBusyKey] = React.useState<MuteKey | null>(null);

  const current = settings
    ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...settings }
    : DEFAULT_NOTIFICATION_SETTINGS;

  const handleToggle = async (key: MuteKey, muted: boolean) => {
    setBusyKey(key);
    try {
      await update.mutateAsync({ [key]: muted });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'সেটিং সংরক্ষণ করা যায়নি');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BellOff className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-base font-semibold">নোটিফিকেশন পছন্দ</h3>
          <p className="text-xs text-muted-foreground">কোন ধরনের নোটিফিকেশন পাবেন না তা বেছে নিন</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {ROWS.map((r) => (
            <div key={r.key} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {ROWS.map((row) => {
            const Icon = row.icon;
            const muted = current[row.key];
            const busy = busyKey === row.key;
            return (
              <li key={row.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    row.tone
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.description}</p>
                </div>
                <Switch
                  aria-label={`${row.label} নোটিফিকেশন ${muted ? 'বন্ধ' : 'চালু'}`}
                  checked={!muted}
                  disabled={busy || update.isPending}
                  onCheckedChange={(on) => handleToggle(row.key, !on)}
                />
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-[11px] text-muted-foreground/70">
        বন্ধ থাকা ক্যাটাগরির নোটিফিকেশন তৈরি হবে না — ব্যাজ ও টোস্ট দুটোই স্বয়ংক্রিয়ভাবে নীরব থাকবে।
      </p>
    </div>
  );
}
