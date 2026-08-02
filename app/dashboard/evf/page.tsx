'use client';

import { EventForum } from '@/components/modules/event-forum';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardEventsPage() {
  return (
    <div className="space-y-5">
      <PageHeader size="md" title="ইভেন্ট ফোরাম" description="ক্লাব ইভেন্ট পরিচালনা ও দেখুন।" />
      <EventForum />
    </div>
  );
}
