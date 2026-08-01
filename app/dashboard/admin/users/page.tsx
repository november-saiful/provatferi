'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AdminUsers } from '@/components/modules/admin-users';

export default function DashboardAdminUsersPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp']}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">User management</h1>
          <p className="text-sm text-muted-foreground">Assign and change member roles.</p>
        </div>
        <AdminUsers />
      </div>
    </RoleGuard>
  );
}
