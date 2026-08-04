'use client';

import * as React from 'react';
import Link from 'next/link';
import { useInView, useMotionValue, useSpring } from 'framer-motion';
import {
  CalendarDays,
  Bell,
  HandCoins,
  Receipt,
  Wallet,
  History,
  Music4,
  BarChart3,
  ArrowRight,
  Images,
  Calendar,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { Seo } from '@/components/seo';
import {
  useEvents,
  useNotices,
  useBudgets,
  useCourseSchedules,
  useAllAttendance,
  useRealtimeInvalidate
} from '@/lib/queries';
import { canRead, isCommitteeMember } from '@/lib/permissions';
import { BalanceWidget } from '@/components/layout/balance-widget';
import { AddToCalendar } from '@/components/ui/add-to-calendar';
import { ROLE_NAMES } from '@/lib/permissions';
import { formatDate, formatMoney, toBengaliDigits } from '@/lib/utils';
import { RECRUITMENT_URL, EVENT_STATUS_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Stagger, StaggerItem } from '@/components/ui/motion';

function CountUp({
  value,
  format = (n) => n.toLocaleString('bn'),
  className
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const spring = useSpring(useMotionValue(0), { stiffness: 80, damping: 22, mass: 0.6 });

  React.useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, value, spring]);

  const [display, setDisplay] = React.useState(() => format(0));
  React.useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(format(Math.round(v))));
    return unsub;
  }, [spring, format]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

const STAT_GRADIENT: Record<string, string> = {
  budgets: 'from-sage-500/10 to-sage-600/5 dark:from-sage-500/15 dark:to-sage-400/5',
  events: 'from-amber-500/10 to-amber-600/5 dark:from-amber-500/15 dark:to-amber-400/5',
  classes: 'from-taupe-500/10 to-taupe-600/5 dark:from-taupe-500/15 dark:to-taupe-400/5'
};
const STAT_ICON_BG: Record<string, string> = {
  budgets: 'bg-gradient-to-br from-sage-500 to-sage-600 text-white shadow-sage-500/25',
  events: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/25',
  classes: 'bg-gradient-to-br from-taupe-500 to-taupe-600 text-white shadow-taupe-500/25'
};

export default function DashboardHome() {
  const { profile, role } = useAuthStore();
  useRealtimeInvalidate('events', [['events']]);
  const { data: events } = useEvents('all');
  const { data: notices } = useNotices();
  const { data: budgets } = useBudgets(isCommitteeMember(role));
  const { data: schedules } = useCourseSchedules();
  const { data: attendance } = useAllAttendance(true);
  const recruitmentUrl = RECRUITMENT_URL;

  const upcoming = (events ?? []).filter((e) => e.status === 'upcoming').slice(0, 4);
  const pinned = (notices ?? []).filter((n) => n.is_pinned).slice(0, 3);
  const classesHeld = attendance?.filter((a) => a.is_present).length ?? 0;

  const stats = [
    {
      key: 'budgets',
      label: 'সক্রিয় বাজেট',
      icon: Wallet,
      node: (
        <CountUp
          value={(budgets ?? []).filter((b) => b.status === 'active').length}
          className="text-2xl font-bold tracking-tight"
        />
      )
    },
    {
      key: 'events',
      label: 'আসন্ন ইভেন্ট',
      icon: CalendarDays,
      node: <CountUp value={upcoming.length} className="text-2xl font-bold tracking-tight" />
    },
    {
      key: 'classes',
      label: 'অনুষ্ঠিত ক্লাস',
      icon: Music4,
      node: (
        <p className="text-2xl font-bold tracking-tight">
          <CountUp value={classesHeld} />
          <span className="ml-1 text-base font-medium text-muted-foreground">
            /{toBengaliDigits(schedules?.length ?? 6)}
          </span>
        </p>
      )
    }
  ];

  return (
    <Stagger className="space-y-5 sm:space-y-6" gap={10} y={12}>
      <Seo title="ড্যাশবোর্ড" />
      {/* Balance Widget — universal balance for all signed-in users, at the very top */}
      <StaggerItem>
        <BalanceWidget variant="dashboard" />
      </StaggerItem>

      {/* Welcome Banner */}
      <StaggerItem>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-coffee-800 via-coffee-700 to-taupe-700 p-5 text-white shadow-xl sm:p-6 md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/15 blur-[60px] animate-glow-pulse"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-sage-400/10 blur-[60px] animate-glow-pulse"
            style={{ animationDelay: '1.5s' }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">আবারও স্বাগতম,</p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight md:text-3xl">
                {profile?.full_name ?? 'সদস্য'}
              </h1>
              <p className="mt-1.5 text-sm text-white/60">
                {role ? ROLE_NAMES[role] : ''}
              </p>
            </div>
            <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-gold-400" />
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* Stat Cards — committee members only */}
      {isCommitteeMember(role) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <StaggerItem key={s.key} className="min-w-0">
                <div className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${STAT_GRADIENT[s.key]} p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:hover:-translate-y-1`}>
                  <span className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-150" aria-hidden />
                  <span className="absolute -right-1 -top-1 h-12 w-12 rounded-full bg-white/5" aria-hidden />
                  <div className="relative flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg ${STAT_ICON_BG[s.key]} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="truncate text-xs font-medium text-muted-foreground uppercase tracking-wide sm:text-sm">
                      {s.label}
                    </p>
                  </div>
                  <div className="relative mt-2">
                    {s.node}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </div>
      )}

      {/* Recruitment CTA */}
      <StaggerItem>
        <a
          href={recruitmentUrl}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-coffee-700 via-coffee-600 to-taupe-600 p-4 text-white shadow-lg transition-all duration-400 hover:-translate-y-1 hover:shadow-2xl sm:items-center sm:gap-5 sm:p-5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 transition-transform duration-400 group-hover:scale-110 group-hover:bg-white/20 sm:h-14 sm:w-14">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold sm:text-lg">নিয়োগ চলছে</p>
            <p className="text-xs text-white/75 sm:text-sm">দলে যোগ দিন — আবেদন গ্রহণ করা হচ্ছে।</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-400 group-hover:translate-x-1.5" />
        </a>
      </StaggerItem>

      {/* Events + Notices */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <StaggerItem>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-coffee-500 via-coffee-400 to-amber-400" />
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-coffee-100 text-coffee-600 dark:bg-coffee-900/50 dark:text-coffee-400">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold tracking-tight">আসন্ন ইভেন্ট</h3>
                </div>
                <Link href="/dashboard/evf" className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
                  সব দেখুন →
                </Link>
              </div>
              <div className="space-y-1.5">
                {upcoming.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">কোনো আসন্ন ইভেন্ট নেই।</p>
                )}
                {upcoming.map((e) => (
                  <Link
                    key={e.id}
                    href={`/dashboard/evf/item?id=${e.id}`}
                    className="group flex items-center gap-3 rounded-xl p-2.5 -mx-1 transition-all duration-200 hover:bg-muted/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-coffee-50 text-coffee-500 transition-all duration-200 group-hover:bg-coffee-100 group-hover:scale-110 dark:bg-coffee-900/30 dark:text-coffee-400">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{e.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(e.event_date)}</p>
                    </div>
                    {e.event_date && (
                      <AddToCalendar
                        data={{
                          title: e.title,
                          description: e.description,
                          location: e.location,
                          startDate: e.event_date,
                        }}
                        size="icon"
                      />
                    )}
                    <Badge variant="coffee" className="shrink-0 text-[10px]">
                      {EVENT_STATUS_LABELS[e.status] ?? e.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-warmred-400" />
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                    <Bell className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold tracking-tight">পিন করা নোটিশ</h3>
                </div>
                <Link href="/dashboard/ntb" className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
                  নোটিশ বোর্ড →
                </Link>
              </div>
              <div className="space-y-1.5">
                {pinned.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">কোনো পিন করা নোটিশ নেই।</p>
                )}
                {pinned.map((n) => (
                  <Link
                    key={n.id}
                    href={`/dashboard/ntb/item?id=${n.id}`}
                    className="group flex items-start gap-3 rounded-xl p-2.5 -mx-1 transition-all duration-200 hover:bg-muted/60"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 transition-all duration-200 group-hover:bg-amber-100 group-hover:scale-110 dark:bg-amber-900/30 dark:text-amber-400">
                      <Bell className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{n.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(n.created_at)}</p>
                    </div>
                    <AddToCalendar
                      data={{
                        title: n.title,
                        description: n.content,
                        startDate: n.created_at,
                      }}
                      size="icon"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </StaggerItem>
      </div>

      {/* Quick Links Grid */}
      <div>
        <StaggerItem className="mb-3 sm:mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">দ্রুত প্রবেশ</h2>
        </StaggerItem>
        <Stagger className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5" gap={6} y={10}>
          {(
            [
              { href: '/dashboard/evf', label: 'ইভেন্ট', icon: CalendarDays, color: 'from-coffee-400 to-coffee-500' },
              { href: '/dashboard/glr', label: 'গ্যালারি', icon: Images, color: 'from-purple-400 to-purple-500' },
              { href: '/dashboard/cln', label: 'ক্যালেন্ডার', icon: Calendar, color: 'from-sky-400 to-sky-500' },
              { href: '/dashboard/ntb', label: 'নোটিশ', icon: Bell, color: 'from-amber-400 to-amber-500' },
              { href: '/dashboard/dnt', label: 'অনুদান', icon: HandCoins, color: 'from-rose-400 to-rose-500' },
              { href: '/dashboard/xpm', label: 'ব্যয়', icon: Receipt, color: 'from-orange-400 to-orange-500', need: canRead(role, 'xpm') },
              { href: '/dashboard/bgm', label: 'বাজেট', icon: Wallet, color: 'from-sage-400 to-sage-500', need: canRead(role, 'bgm') },
              { href: '/dashboard/rcd', label: 'রেকর্ড', icon: History, color: 'from-indigo-400 to-indigo-500', need: canRead(role, 'rcd') },
              { href: '/dashboard/cia', label: 'উপস্থিতি', icon: Music4, color: 'from-teal-400 to-teal-500' },
              { href: '/dashboard/coi', label: 'বিশ্লেষণ', icon: BarChart3, color: 'from-violet-400 to-violet-500' }
            ] as { href: string; label: string; icon: typeof CalendarDays; color: string; need?: boolean }[]
          )
            .filter((item) => item.need !== false)
            .map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 sm:p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-md"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-foreground/80 group-hover:text-foreground transition-colors">{item.label}</span>
                  </Link>
                </StaggerItem>
              );
            })}
        </Stagger>
      </div>
    </Stagger>
  );
}
