'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AttendanceManage } from '@/components/modules/attendance-manage';

export default function DashboardAttendanceManagePage() {
  return (
    <RoleGuard allowedRoles={['cc', 'pr', 'vp']}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Manage attendance</h1>
          <p className="text-sm text-muted-foreground">Record class attendance for the six courses.</p>
        </div>
        <AttendanceManage />
      </div>
    </RoleGuard>
  );
}
