'use client';

import dynamic from 'next/dynamic';
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
        <PageHeader title="ক্যালেন্ডার" description="সভা, ইভেন্ট ও রিহার্সাল এক নজরে।" />
        <CalendarView />
      </div>
    </PublicShell>
  );
}
