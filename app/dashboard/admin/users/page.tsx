'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AdminUsers } from '@/components/modules/admin-users';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAdminUsersPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp']}>
      <div className="space-y-5">
        <PageHeader size="md" title="ব্যবহারকারী ব্যবস্থাপনা" description="সদস্যদের ভূমিকা নির্ধারণ ও পরিবর্তন করুন।" />
        <AdminUsers />
      </div>
    </RoleGuard>
  );
}
