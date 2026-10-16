'use client';

import { Seo } from '@/components/seo';
import { NoticeBoard } from '@/components/modules/notice-board';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardNoticesPage() {
  return (
    <div className="space-y-5">
      <Seo title="নোটিশ বোর্ড" />
      <PageHeader size="md" title="নোটিশ বোর্ড" description="অফিসিয়াল ঘোষণা।" />
      <NoticeBoard />
    </div>
  );
}
