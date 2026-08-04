'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Inbox,
  Pencil,
  Handshake,
  Heart,
  UserCog,
  MessageSquare,
  CalendarCheck,
  Settings2,
  type LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useClearNotifications
} from '@/lib/queries';
import { relativeTime, cn, toBengaliDigits } from '@/lib/utils';
import type { AppNotification, AppNotificationType } from '@/lib/types';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownSeparator
} from '@/components/ui/dropdown-menu';

const TYPE_ICON: Record<AppNotificationType, { icon: LucideIcon; tone: string }> = {
  record_edited: { icon: Pencil, tone: 'bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-300' },
  record_deleted: { icon: Trash2, tone: 'bg-warmred-100 text-warmred-700 dark:bg-warmred-900/50 dark:text-warmred-300' },
  sponsor_inquiry: { icon: Handshake, tone: 'bg-gold-100 text-gold-700 dark:bg-gold-900/50 dark:text-gold-300' },
  donation: { icon: Heart, tone: 'bg-warmred-100 text-warmred-700 dark:bg-warmred-900/50 dark:text-warmred-300' },
  role_changed: { icon: UserCog, tone: 'bg-coffee-100 text-coffee-700 dark:bg-coffee-900/50 dark:text-coffee-300' },
  event_comment: { icon: MessageSquare, tone: 'bg-taupe-100 text-taupe-700 dark:bg-taupe-900/50 dark:text-taupe-300' },
  event_rsvp: { icon: CalendarCheck, tone: 'bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-300' }
};

/**
 * Drive-style notification bell: badge with unread count in the app bar, a
 * dropdown panel of the latest notifications, mark-as-read on open, "mark all
 * read" and "clear all" actions. Backed by the `notifications` table, which is
 * filled by DB triggers (spec §7.1) and streamed over Realtime (spec §7.2).
 */
export function NotificationsMenu() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [open, setOpen] = React.useState(false);
  const [confirmingClear, setConfirmingClear] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // Track the panel state in a ref so the realtime toast callback (kept stable)
  // can suppress previews while the user is already looking at the list.
  const openRef = React.useRef(open);
  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  const handleNewNotification = React.useCallback(
    (n: AppNotification) => {
      if (openRef.current) return; // already visible in the open panel
      const href = n.data?.href;
      // Fixed id dedupes rapid arrivals (e.g. bulk record deletes); the longer
      // duration gives time to read the Bengali body.
      toast(n.title, {
        id: 'notification-preview',
        duration: 6000,
        description: n.body,
        action: href
          ? {
              label: 'দেখুন',
              onClick: () => {
                setOpen(false);
                router.push(href);
              }
            }
          : undefined
      });
    },
    [router]
  );

  const { data: notifications = [] } = useNotifications(!!user, handleNewNotification);
  const { data: unreadCount = 0 } = useUnreadNotificationCount(!!user);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const clearAll = useClearNotifications();

  const unread = unreadCount;

  // Reset the clear-confirmation state whenever the panel opens/closes.
  React.useEffect(() => {
    if (!open) setConfirmingClear(false);
  }, [open]);

  const handleOpen = (n: AppNotification) => {
    if (!n.is_read && busyId !== n.id) {
      setBusyId(n.id);
      markRead.mutate(n.id, {
        onSettled: () => setBusyId(null),
        onError: (err) => toast.error(err.message ?? 'নোটিফিকেশন আপডেট করা যায়নি')
      });
    }
    const href = n.data?.href;
    if (href) {
      setOpen(false);
      router.push(href);
    }
  };

  const handleClearAll = async () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    setConfirmingClear(false);
    setOpen(false);
    try {
      await clearAll.mutateAsync(undefined);
    } catch (err) {
      toast.error((err as Error).message ?? 'নোটিফিকেশন মুছতে পারেনি');
    }
  };

  return (
    <Dropdown open={open} onOpenChange={setOpen} align="end" side="bottom" sideOffset={10}>
      <DropdownTrigger asChild>
        <button
          type="button"
          aria-label="নোটিফিকেশন"
          aria-haspopup="menu"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
        >
          {unread > 0 ? (
            <BellRing className="h-[18px] w-[18px] text-primary" />
          ) : (
            <Bell className="h-[18px] w-[18px]" />
          )}
          {unread > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warmred-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background"
              aria-label={`${toBengaliDigits(unread)}টি অপঠিত নোটিফিকেশন`}
            >
              {toBengaliDigits(unread)}
            </span>
          )}
        </button>
      </DropdownTrigger>

      <DropdownContent
        size="auto"
        align="end"
        className="w-[min(22rem,calc(100vw-1.25rem))] p-0"
        sideOffset={10}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">নোটিফিকেশন</h3>
            {unread > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {toBengaliDigits(unread)} নতুন
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={unread === 0 || markAllRead.isPending}
              onClick={() =>
                markAllRead.mutate(undefined, {
                  onError: (err) => toast.error(err.message ?? 'সব পড়া চিহ্নিত করা যায়নি')
                })
              }
              className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              title="সব পড়া হয়েছে হিসেবে চিহ্নিত করুন"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">সব পড়া</span>
            </button>
            <button
              type="button"
              disabled={notifications.length === 0 || clearAll.isPending}
              onClick={handleClearAll}
              className={cn(
                'flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40',
                confirmingClear
                  ? 'bg-warmred-100 text-warmred-700 hover:bg-warmred-200 dark:bg-warmred-900/40 dark:text-warmred-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={confirmingClear ? 'আবার চাপলে সব মুছে যাবে' : 'সব নোটিফিকেশন মুছুন'}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{confirmingClear ? 'নিশ্চিত?' : 'সব মুছুন'}</span>
            </button>
          </div>
        </div>
        <DropdownSeparator className="my-0" />

        {/* Settings shortcut */}
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            router.push('/dashboard/profile');
          }}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
        >
          <Settings2 className="h-3.5 w-3.5" />
          নোটিফিকেশন পছন্দ
        </button>
        <DropdownSeparator className="my-0" />

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">কোনো নোটিফিকেশন নেই</p>
            <p className="max-w-[16rem] text-xs text-muted-foreground">
              রেকর্ড পরিবর্তন, নতুন মন্তব্য, ইভেন্ট অংশগ্রহণ ও স্পনসর আপডেট এখানে দেখা যাবে।
            </p>
          </div>
        ) : (
          <ul className="max-h-[min(26rem,60vh)] overflow-y-auto py-1.5">
            {notifications.map((n) => {
              const { icon: Icon, tone } = TYPE_ICON[n.type] ?? TYPE_ICON.record_edited;
              const isUnread = !n.is_read;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleOpen(n)}
                    className={cn(
                      'group flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/70',
                      isUnread && 'bg-primary/[0.04]'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        tone
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'truncate text-[13px] leading-tight',
                            isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground/80'
                          )}
                        >
                          {n.title}
                        </span>
                        {isUnread && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[10.5px] font-medium text-muted-foreground/70">
                        {relativeTime(n.created_at)}
                      </span>
                    </span>
                    {n.data?.href && (
                      <span className="mt-1 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary">
                        <Bell className="h-3 w-3" aria-hidden />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownContent>
    </Dropdown>
  );
}
