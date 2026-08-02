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
  ExternalLink,
  ArrowRight,
  Images,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useEvents, useNotices, useExpenses, useBudgets, useCourseSchedules, useAllAttendance, useAppConfig } from '@/lib/queries';
import { canRead } from '@/lib/permissions';
import { ROLE_NAMES } from '@/lib/permissions';
import { formatDate, formatMoney } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stagger, StaggerItem } from '@/components/ui/motion';

function CountUp({
  value,
  format = (n) => n.toLocaleString(),
  className
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const spring = useSpring(useMotionValue(0), { stiffness: 90, damping: 24, mass: 0.6 });

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
  total: 'bg-coffee-50 text-coffee-600 dark:bg-coffee-900/40 dark:text-coffee-300',
  budgets: 'bg-sage-50 text-sage-600 dark:bg-sage-900/40 dark:text-sage-300',
  events: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
  classes: 'bg-taupe-50 text-taupe-600 dark:bg-taupe-900/40 dark:text-taupe-300'
};

export default function DashboardHome() {
  const { profile, role } = useAuthStore();
  const { data: events } = useEvents('all');
  const { data: notices } = useNotices();
  const { data: expenses } = useExpenses(canRead(role, 'xpm'));
  const { data: budgets } = useBudgets(canRead(role, 'bgm'));
  const { data: schedules } = useCourseSchedules();
  const { data: attendance } = useAllAttendance(true);
  const { data: recruitment } = useAppConfig('recruitment_url');
  const recruitmentUrl = recruitment || process.env.NEXT_PUBLIC_RECRUITMENT_URL || 'https://recruitment.provatferi2009.workers.dev/';

  const upcoming = (events ?? []).filter((e) => e.status === 'upcoming').slice(0, 4);
  const pinned = (notices ?? []).filter((n) => n.is_pinned).slice(0, 3);
  const totalSpent = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const classesHeld = attendance?.filter((a) => a.is_present).length ?? 0;

  const stats = [
    {
      key: 'total',
      label: 'Total expenses',
      icon: Receipt,
      node: (
        <CountUp value={totalSpent} format={(n) => formatMoney(n)} className="mt-1 text-2xl font-bold tracking-tight" />
      )
    },
    {
      key: 'budgets',
      label: 'Active budgets',
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
      label: 'Upcoming events',
      icon: CalendarDays,
      node: <CountUp value={upcoming.length} className="mt-1 text-2xl font-bold tracking-tight" />
    },
    {
      key: 'classes',
      label: 'Classes held',
      icon: Music4,
      node: (
        <p className="mt-1 text-2xl font-bold tracking-tight">
          <CountUp value={classesHeld} />
          <span className="text-base font-medium text-muted-foreground">/{schedules?.length ?? 6} courses</span>
        </p>
      )
    }
  ];

  return (
    <Stagger className="space-y-6" gap={8}>
      <StaggerItem className="relative overflow-hidden rounded-xl2 bg-gradient-to-br from-coffee-700 to-taupe-700 p-6 text-white shadow-lift">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" aria-hidden />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/20 blur-2xl animate-glow-pulse"
          aria-hidden
        />
        <div className="relative">
          <p className="text-sm text-white/80">Welcome back,</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight md:text-3xl">
            {profile?.full_name ?? 'Member'}
          </h1>
          <p className="mt-1 text-sm text-white/80">
            {role ? ROLE_NAMES[role] : ''}
            {profile?.display_id ? ` · ${profile.display_id}` : ''}
          </p>
        </div>
      </StaggerItem>

      {canRead(role, 'xpm') && expenses !== undefined && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <StaggerItem key={s.key} className="min-w-0">
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${STAT_STYLE[s.key]}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="truncate text-xs text-muted-foreground sm:text-sm">{s.label}</p>
                    </div>
                    {s.node}
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </div>
      )}

      <StaggerItem>
        <a
          href={recruitmentUrl}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 rounded-xl2 bg-gradient-to-br from-coffee-600 to-taupe-600 p-5 text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-transform duration-300 group-hover:scale-110">
            <ExternalLink className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Recruitment open</p>
            <p className="truncate text-sm text-white/80">Join the team — applications are being accepted.</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
        </a>
      </StaggerItem>

      <div className="grid gap-6 lg:grid-cols-2">
        <StaggerItem>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Upcoming events</CardTitle>
              <Link href="/dashboard/evf" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
              {upcoming.map((e) => (
                <Link
                  key={e.id}
                  href={`/dashboard/evf/item?id=${e.id}`}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted hover:shadow-soft"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-coffee-100 text-coffee-700 transition-transform duration-200 group-hover:scale-110 dark:bg-coffee-900/40 dark:text-coffee-300">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.event_date)}</p>
                    </div>
                  </div>
                  <Badge variant="coffee" className="shrink-0 capitalize">{e.status}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Pinned notices</CardTitle>
              <Link href="/dashboard/ntb" className="text-sm font-medium text-primary hover:underline">
                Notice board
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {pinned.length === 0 && <p className="text-sm text-muted-foreground">No pinned notices.</p>}
              {pinned.map((n) => (
                <Link
                  key={n.id}
                  href={`/dashboard/ntb/item?id=${n.id}`}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted hover:shadow-soft"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </StaggerItem>
      </div>

      <div>
        <StaggerItem className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-coffee-600" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick access</h2>
        </StaggerItem>
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8" gap={6} y={10}>
          {(
            [
              { href: '/dashboard/evf', label: 'Events', icon: CalendarDays, read: true },
              { href: '/dashboard/glr', label: 'Gallery', icon: Images, read: true },
              { href: '/dashboard/cln', label: 'Calendar', icon: Calendar, read: true },
              { href: '/dashboard/ntb', label: 'Notices', icon: Bell, read: true },
              { href: '/dashboard/dnt', label: 'Donations', icon: HandCoins, read: true },
              { href: '/dashboard/xpm', label: 'Expenses', icon: Receipt, read: canRead(role, 'xpm') },
              { href: '/dashboard/bgm', label: 'Budgets', icon: Wallet, read: canRead(role, 'bgm') },
              { href: '/dashboard/rcd', label: 'Records', icon: History, read: canRead(role, 'rcd') },
              { href: '/dashboard/cia', label: 'Attendance', icon: Music4, read: true },
              { href: '/dashboard/coi', label: 'Insights', icon: BarChart3, read: true }
            ] as { href: string; label: string; icon: typeof CalendarDays; read: boolean }[]
          )
            .filter((item) => item.read)
            .map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex flex-col items-center gap-2 rounded-xl2 border border-border bg-card p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-coffee-50 text-coffee-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground dark:bg-coffee-900/40 dark:text-coffee-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                </StaggerItem>
              );
            })}
        </Stagger>
      </div>
    </Stagger>
  );
}
