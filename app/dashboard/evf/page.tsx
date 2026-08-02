'use client';

import { EventForum } from '@/components/modules/event-forum';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardEventsPage() {
  return (
    <div className="space-y-5">
      <PageHeader size="md" title="Event forum" description="Manage and explore club events." />
      <EventForum />
    </div>
  );
}
