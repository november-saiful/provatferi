'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Seo } from '@/components/seo';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';

const TaskBoard = dynamic(
  () => import('@/components/modules/task-board').then((m) => m.TaskBoard),
  { ssr: false, loading: () => <Skeleton className="h-[70vh] w-full" /> }
);

const TaskCalendarView = dynamic(
  () => import('@/components/modules/task-calendar-view').then((m) => m.TaskCalendarView),
  { ssr: false, loading: () => <Skeleton className="h-[70vh] w-full" /> }
);

const VIEW_TABS = [
  { value: 'board', label: 'বোর্ড' },
  { value: 'calendar', label: 'ক্যালেন্ডার' }
];

export default function DashboardTaskPage() {
  const [view, setView] = React.useState('board');

  return (
    <div className="space-y-5">
      <Seo title="টাস্ক" />
      <PageHeader size="md" title="টাস্ক" description="ক্লাবের কাজের তালিকা ও দায়িত্ব বণ্টন।" />
      <Tabs value={view} onValueChange={setView} items={VIEW_TABS} />
      {view === 'board' ? <TaskBoard /> : <TaskCalendarView />}
    </div>
  );
}
