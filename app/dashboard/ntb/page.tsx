'use client';

import { NoticeBoard } from '@/components/modules/notice-board';

export default function DashboardNoticesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Notice board</h1>
        <p className="text-sm text-muted-foreground">Official announcements.</p>
      </div>
      <NoticeBoard />
    </div>
  );
}
