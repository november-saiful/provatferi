'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AdminRoles } from '@/components/modules/admin-roles';

export default function DashboardAdminRolesPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp']}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Role permissions</h1>
          <p className="text-sm text-muted-foreground">Reference view of module access by role.</p>
        </div>
        <AdminRoles />
      </div>
    </RoleGuard>
  );
}
