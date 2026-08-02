'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AttendanceManage } from '@/components/modules/attendance-manage';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAttendanceManagePage() {
  return (
    <RoleGuard allowedRoles={['cc', 'gs', 'jgs', 'pr', 'vp']}>
      <div className="space-y-5">
        <PageHeader size="md" title="উপস্থিতি পরিচালনা" description="ছয়টি কোর্সের ক্লাস উপস্থিতি রেকর্ড করুন।" />
        <AttendanceManage />
      </div>
    </RoleGuard>
  );
}
