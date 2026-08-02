'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AdminRoles } from '@/components/modules/admin-roles';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAdminRolesPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp']}>
      <div className="space-y-5">
        <PageHeader size="md" title="Role permissions" description="Reference view of module access by role." />
        <AdminRoles />
      </div>
    </RoleGuard>
  );
}
