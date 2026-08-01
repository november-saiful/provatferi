'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Records } from '@/components/modules/records';

export default function DashboardRecordsPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'cs', 'acs', 'pps', 'prs', 'rds', 'cc']}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Records &amp; audit log</h1>
          <p className="text-sm text-muted-foreground">Full history of changes to financial and operational records.</p>
        </div>
        <Records />
      </div>
    </RoleGuard>
  );
}
