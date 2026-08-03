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
import {
  useEvents,
  useNotices,
  useExpenses,
  useBudgets,
  useCourseSchedules,
  useAllAttendance,
  useRealtimeInvalidate
} from '@/lib/queries';
import { canRead } from '@/lib/permissions';
import { ROLE_NAMES } from '@/lib/permissions';
import { formatDate, formatMoney, toBengaliDigits } from '@/lib/utils';
import { RECRUITMENT_URL, EVENT_STATUS_LABELS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const STAT_STYLE: Record<string, string> = {
  total: 'bg-coffee-100 text-coffee-700 dark:bg-coffee-900/50 dark:text-coffee-400',
  budgets: 'bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-400',
  events: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  classes: 'bg-taupe-100 text-taupe-700 dark:bg-taupe-900/50 dark:text-taupe-400'
};

export default function DashboardHome() {
  const { profile, role } = useAuthStore();
  // Spec §7.2: upcoming-events widget refreshes live without a page reload.
  useRealtimeInvalidate('events', [['events']]);
  const { data: events } = useEvents('all');
  const { data: notices } = useNotices();
  const { data: expenses } = useExpenses(canRead(role, 'xpm'));
  const { data: budgets } = useBudgets(canRead(role, 'bgm'));
  const { data: schedules } = useCourseSchedules();
  const { data: attendance } = useAllAttendance(true);
  const recruitmentUrl = RECRUITMENT_URL;

  const upcoming = (events ?? []).filter((e) => e.status === 'upcoming').slice(0, 4);
  const pinned = (notices ?? []).filter((n) => n.is_pinned).slice(0, 3);
  const totalSpent = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const classesHeld = attendance?.filter((a) => a.is_present).length ?? 0;

  const stats = [
    {
      key: 'total',
      label: 'মোট ব্যয়',
      icon: Receipt,
      node: <CountUp value={totalSpent} format={(n) => formatMoney(n)} className="mt-1 text-2xl font-bold tracking-tight" />
    },
    {
      key: 'budgets',
      label: 'সক্রিয় বাজেট',
      icon: Wallet,
      node: (
        <CountUp
          value={(budgets ?? []).filter((b) => b.status === 'active').length}
          className="mt-1 text-2xl font-bold tracking-tight"
        />
      )
    },
    {
      key: 'events',
      label: 'আসন্ন ইভেন্ট',
      icon: CalendarDays,
      node: <CountUp value={upcoming.length} className="mt-1 text-2xl font-bold tracking-tight" />
    },
    {
      key: 'classes',
      label: 'অনুষ্ঠিত ক্লাস',
      icon: Music4,
      node: (
        <p className="mt-1 text-2xl font-bold tracking-tight">
          <CountUp value={classesHeld} />
          <span className="text-base font-medium text-muted-foreground">
            /{toBengaliDigits(schedules?.length ?? 6)} কোর্স
          </span>
        </p>
      )
    }
  ];

  return (
    <Stagger className="space-y-6" gap={10} y={12}>
      {/* Welcome Banner */}
      <StaggerItem>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-coffee-800 via-coffee-700 to-taupe-700 p-6 text-white shadow-xl md:p-8">
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
          <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">আবারও স্বাগতম,</p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight md:text-3xl">
                {profile?.full_name ?? 'সদস্য'}
              </h1>
              <p className="mt-1.5 text-sm text-white/60">
                {role ? ROLE_NAMES[role] : ''}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-gold-400" />
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* Stat Cards */}
      {canRead(role, 'xpm') && expenses !== undefined && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <StaggerItem key={s.key} className="min-w-0">
                <Card className="card-hover h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${STAT_STYLE[s.key]}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="truncate text-xs font-medium text-muted-foreground uppercase tracking-wide sm:text-sm">
                        {s.label}
                      </p>
                    </div>
                    {s.node}
                  </CardContent>
                </Card>
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
          className="group flex items-center gap-5 rounded-2xl bg-gradient-to-r from-coffee-700 via-coffee-600 to-taupe-600 p-5 text-white shadow-lg transition-all duration-400 hover:-translate-y-1 hover:shadow-2xl"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/12 transition-transform duration-400 group-hover:scale-110 group-hover:bg-white/20">
            <Users className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold">নিয়োগ চলছে</p>
            <p className="text-sm text-white/75">দলে যোগ দিন — আবেদন গ্রহণ করা হচ্ছে।</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-400 group-hover:translate-x-1.5" />
        </a>
      </StaggerItem>

      {/* Events + Notices */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StaggerItem>
          <Card className="card-hover">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">আসন্ন ইভেন্ট</CardTitle>
              <Link href="/dashboard/evf" className="text-sm font-semibold text-primary hover:underline">
                সব দেখুন
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">কোনো আসন্ন ইভেন্ট নেই।</p>
              )}
              {upcoming.map((e) => (
                <Link
                  key={e.id}
                  href={`/dashboard/evf/item?id=${e.id}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-muted/20 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted/50 hover:shadow-md"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coffee-100 text-coffee-700 transition-transform duration-200 group-hover:scale-110 dark:bg-coffee-900/50 dark:text-coffee-400">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.event_date)}</p>
                    </div>
                  </div>
                  <Badge variant="coffee" className="shrink-0">
                    {EVENT_STATUS_LABELS[e.status] ?? e.status}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="card-hover">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">পিন করা নোটিশ</CardTitle>
              <Link href="/dashboard/ntb" className="text-sm font-semibold text-primary hover:underline">
                নোটিশ বোর্ড
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {pinned.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">কোনো পিন করা নোটিশ নেই।</p>
              )}
              {pinned.map((n) => (
                <Link
                  key={n.id}
                  href={`/dashboard/ntb/item?id=${n.id}`}
                  className="group flex items-start gap-3 rounded-xl border-2 border-border bg-muted/20 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted/50 hover:shadow-md"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </StaggerItem>
      </div>

      {/* Quick Links Grid */}
      <div>
        <StaggerItem className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">দ্রুত প্রবেশ</h2>
        </StaggerItem>
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5" gap={6} y={10}>
          {(
            [
              { href: '/dashboard/evf', label: 'ইভেন্ট', icon: CalendarDays },
              { href: '/dashboard/glr', label: 'গ্যালারি', icon: Images },
              { href: '/dashboard/cln', label: 'ক্যালেন্ডার', icon: Calendar },
              { href: '/dashboard/ntb', label: 'নোটিশ', icon: Bell },
              { href: '/dashboard/dnt', label: 'অনুদান', icon: HandCoins },
              { href: '/dashboard/xpm', label: 'ব্যয়', icon: Receipt, need: canRead(role, 'xpm') },
              { href: '/dashboard/bgm', label: 'বাজেট', icon: Wallet, need: canRead(role, 'bgm') },
              { href: '/dashboard/rcd', label: 'রেকর্ড', icon: History, need: canRead(role, 'rcd') },
              { href: '/dashboard/cia', label: 'উপস্থিতি', icon: Music4 },
              { href: '/dashboard/coi', label: 'বিশ্লেষণ', icon: BarChart3 }
            ] as { href: string; label: string; icon: typeof CalendarDays; need?: boolean }[]
          )
            .filter((item) => item.need !== false)
            .map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex flex-col items-center gap-2.5 rounded-2xl border-2 border-border bg-card p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-lg"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-coffee-100 to-coffee-200 text-coffee-600 transition-all duration-300 group-hover:scale-110 group-hover:from-primary group-hover:to-accent group-hover:text-white group-hover:shadow-glow dark:from-coffee-900/50 dark:to-coffee-800/50 dark:text-coffee-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </Link>
                </StaggerItem>
              );
            })}
        </Stagger>
      </div>
    </Stagger>
  );
}
