'use client';

import dynamic from 'next/dynamic';
import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

const TaskCalendarView = dynamic(
  () => import('@/components/modules/task-calendar-view').then((m) => m.TaskCalendarView),
  { ssr: false, loading: () => <Skeleton className="h-[70vh] w-full" /> }
);

export default function PublicTasksPage() {
  return (
    <PublicShell>
      <Seo title="টাস্ক" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="টাস্ক" description="ক্লাবের কাজের তালিকা ও দায়িত্ব বণ্টন।" />
        <TaskCalendarView />
      </div>
    </PublicShell>
  );
}
