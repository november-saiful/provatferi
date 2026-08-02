'use client';

import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

const CalendarView = dynamic(
  () => import('@/components/modules/calendar-view').then((m) => m.CalendarView),
  { ssr: false, loading: () => <Skeleton className="h-[70vh] w-full" /> }
);

export default function DashboardCalendarPage() {
  return (
    <div className="space-y-5">
      <PageHeader size="md" title="ক্যালেন্ডার" description="ক্লাবের সময়সূচি এক নজরে।" />
      <CalendarView />
    </div>
  );
}
