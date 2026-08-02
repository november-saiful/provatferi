'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Records } from '@/components/modules/records';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardRecordsPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc']}>
      <div className="space-y-5">
        <PageHeader size="md" title="রেকর্ড ও অডিট লগ" description="আর্থিক ও কার্যকরী রেকর্ডের পরিবর্তনের সম্পূর্ণ ইতিহাস।" />
        <Records />
      </div>
    </RoleGuard>
  );
}
