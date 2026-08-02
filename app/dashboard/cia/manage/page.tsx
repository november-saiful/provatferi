'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AttendanceManage } from '@/components/modules/attendance-manage';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAttendanceManagePage() {
  return (
    <RoleGuard allowedRoles={['cc', 'pr', 'vp']}>
      <div className="space-y-5">
        <PageHeader size="md" title="Manage attendance" description="Record class attendance for the six courses." />
        <AttendanceManage />
      </div>
    </RoleGuard>
  );
}
