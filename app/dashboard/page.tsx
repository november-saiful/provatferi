'use client';

import * as React from 'react';
import Link from 'next/link';
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
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useEvents, useNotices, useExpenses, useBudgets, useCourseSchedules, useAllAttendance, useAppConfig } from '@/lib/queries';
import { canRead } from '@/lib/permissions';
import { ROLE_NAMES } from '@/lib/permissions';
import { formatDate, formatMoney } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardHome() {
  const { profile, role } = useAuthStore();
  const { data: events } = useEvents('all');
  const { data: notices } = useNotices();
  const { data: expenses } = useExpenses(canRead(role, 'xpm'));
  const { data: budgets } = useBudgets(canRead(role, 'bgm'));
  const { data: schedules } = useCourseSchedules();
  const { data: attendance } = useAllAttendance(true);
  const { data: recruitment } = useAppConfig('recruitment_url');
  const recruitmentUrl = recruitment || process.env.NEXT_PUBLIC_RECRUITMENT_URL || 'https://example.com/recruitment';

  const upcoming = (events ?? []).filter((e) => e.status === 'upcoming').slice(0, 4);
  const pinned = (notices ?? []).filter((n) => n.is_pinned).slice(0, 3);
  const totalSpent = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const classesHeld = attendance?.filter((a) => a.is_present).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl2 bg-gradient-to-br from-coffee-700 to-taupe-700 p-6 text-white">
        <p className="text-sm text-white/80">Welcome back,</p>
        <h1 className="text-2xl font-bold md:text-3xl">{profile?.full_name ?? 'Member'}</h1>
        <p className="mt-1 text-sm text-white/80">
          {role ? ROLE_NAMES[role] : ''}
          {profile?.display_id ? ` · ${profile.display_id}` : ''}
        </p>
      </div>

      {canRead(role, 'xpm') && expenses !== undefined && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total expenses</p>
              <p className="mt-1 text-2xl font-bold text-coffee-700">{formatMoney(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active budgets</p>
              <p className="mt-1 text-2xl font-bold">{(budgets ?? []).filter((b) => b.status === 'active').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Upcoming events</p>
              <p className="mt-1 text-2xl font-bold">{upcoming.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Classes held</p>
              <p className="mt-1 text-2xl font-bold text-sage-600">{classesHeld}/{schedules?.length ?? 6} courses</p>
            </CardContent>
          </Card>
        </div>
      )}

      <a
        href={recruitmentUrl}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-4 rounded-xl2 bg-gradient-to-br from-coffee-600 to-taupe-600 p-5 text-white shadow-soft transition-all hover:shadow-lift"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
          <ExternalLink className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Recruitment open</p>
          <p className="text-sm text-white/80">Join the team — applications are being accepted.</p>
        </div>
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </a>

      <div className="grid gap-6 lg:grid-cols-2">
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
              <Link key={e.id} href={`/dashboard/evf/item?id=${e.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-coffee-600" />
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(e.event_date)}</p>
                  </div>
                </div>
                <Badge variant="coffee" className="capitalize">{e.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

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
              <Link key={n.id} href={`/dashboard/ntb/item?id=${n.id}`} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        {[
          { href: '/dashboard/evf', label: 'Events', icon: CalendarDays, read: true },
          { href: '/dashboard/glr', label: 'Gallery', icon: CalendarDays, read: true },
          { href: '/dashboard/cln', label: 'Calendar', icon: CalendarDays, read: true },
          { href: '/dashboard/ntb', label: 'Notices', icon: Bell, read: true },
          { href: '/dashboard/dnt', label: 'Donations', icon: HandCoins, read: true },
          { href: '/dashboard/xpm', label: 'Expenses', icon: Receipt, read: canRead(role, 'xpm') },
          { href: '/dashboard/bgm', label: 'Budgets', icon: Wallet, read: canRead(role, 'bgm') },
          { href: '/dashboard/rcd', label: 'Records', icon: History, read: canRead(role, 'rcd') },
          { href: '/dashboard/cia', label: 'Attendance', icon: Music4, read: true },
          { href: '/dashboard/coi', label: 'Insights', icon: BarChart3, read: true }
        ]
          .filter((item) => item.read)
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2 rounded-xl2 border border-border bg-card p-4 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
                <Icon className="h-5 w-5 text-coffee-600" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
