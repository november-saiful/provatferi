'use client';

import { NoticeBoard } from '@/components/modules/notice-board';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardNoticesPage() {
  return (
    <div className="space-y-5">
      <PageHeader size="md" title="Notice board" description="Official announcements." />
      <NoticeBoard />
    </div>
  );
}
