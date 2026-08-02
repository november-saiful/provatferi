'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AdminUsers } from '@/components/modules/admin-users';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAdminUsersPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp']}>
      <div className="space-y-5">
        <PageHeader size="md" title="User management" description="Assign and change member roles." />
        <AdminUsers />
      </div>
    </RoleGuard>
  );
}
