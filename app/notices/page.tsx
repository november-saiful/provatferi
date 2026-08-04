'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { NoticeBoard } from '@/components/modules/notice-board';
import { PageHeader } from '@/components/ui/page-header';

export default function NoticesPage() {
  return (
    <PublicShell>
      <Seo title="নোটিশ" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <PageHeader title="নোটিশ বোর্ড" description="কমিটি থেকে অফিসিয়াল ঘোষণা — একটি জীবন্ত, ডিজিটাল দেয়ালে সাজানো।" />
        <NoticeBoard basePath="/notices" />
      </div>
    </PublicShell>
  );
}
