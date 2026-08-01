'use client';

import { CalendarView } from '@/components/modules/calendar-view';

export default function DashboardCalendarPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">Club schedule at a glance.</p>
      </div>
      <CalendarView />
    </div>
  );
}
