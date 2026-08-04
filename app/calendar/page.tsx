'use client';

import dynamic from 'next/dynamic';
import { CalendarPlus } from 'lucide-react';
import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

const CalendarView = dynamic(
  () => import('@/components/modules/calendar-view').then((m) => m.CalendarView),
  { ssr: false, loading: () => <Skeleton className="h-[70vh] w-full" /> }
);

export default function CalendarPage() {
  return (
    <PublicShell>
      <Seo title="ক্যালেন্ডার" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageHeader title="ক্যালেন্ডার" description="সভা, ইভেন্ট ও রিহার্সাল এক নজরে।" />
          <a
            href="/api/calendar.ics"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            <span>সাবস্ক্রাইব করুন</span>
            <span className="hidden text-[11px] text-primary/60 sm:inline">(.ics ফিড)</span>
          </a>
        </div>
        <CalendarView />
      </div>
    </PublicShell>
  );
}
