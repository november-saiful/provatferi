'use client';

import { Sponsors } from '@/components/modules/sponsors';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardSponsorsPage() {
  return (
    <div className="space-y-5">
      <PageHeader size="md" title="স্পনসর" description="স্পনসরশিপ আবেদন ও অংশীদারিত্ব।" />
      <Sponsors />
    </div>
  );
}
