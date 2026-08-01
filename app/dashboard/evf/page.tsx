'use client';

import { EventForum } from '@/components/modules/event-forum';

export default function DashboardEventsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Event forum</h1>
        <p className="text-sm text-muted-foreground">Manage and explore club events.</p>
      </div>
      <EventForum />
    </div>
  );
}
