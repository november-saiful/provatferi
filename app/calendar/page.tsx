'use client';

import dynamic from 'next/dynamic';
import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

const CalendarView = dynamic(
  () => import('@/components/modules/calendar-view').then((m) => m.CalendarView),
  { ssr: false, loading: () => <Skeleton className="h-[70vh] w-full" /> }
);

export default function CalendarPage() {
  return (
    <>
      <Seo title="Calendar" />
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="Calendar" description="Meetings, events and rehearsals at a glance." />
        <CalendarView />
      </main>
      <PublicFooter />
    </>
  );
}
