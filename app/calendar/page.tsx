'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { CalendarView } from '@/components/modules/calendar-view';

export default function CalendarPage() {
  return (
    <>
      <Seo title="Calendar" />
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="mt-1 text-muted-foreground">Meetings, events and rehearsals at a glance.</p>
        </div>
        <CalendarView />
      </main>
      <PublicFooter />
    </>
  );
}
