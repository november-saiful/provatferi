'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { NoticeBoard } from '@/components/modules/notice-board';
import { PageHeader } from '@/components/ui/page-header';

export default function NoticesPage() {
  return (
    <PublicShell>
      <Seo title="নোটিশ" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <PageHeader title="নোটিশ বোর্ড" description="কমিটি থেকে অফিসিয়াল ঘোষণা।" />
        <NoticeBoard basePath="/notices" />
      </div>
    </PublicShell>
  );
}
