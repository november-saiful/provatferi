'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Seo } from '@/components/seo';
import { AdminUsers } from '@/components/modules/admin-users';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAdminUsersPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'admin', 'root']}>
      <div className="space-y-5">
        <Seo title="ব্যবহারকারী ব্যবস্থাপনা" />
        <PageHeader size="md" title="ব্যবহারকারী ব্যবস্থাপনা" description="সদস্যদের ভূমিকা নির্ধারণ ও পরিবর্তন করুন।" />
        <AdminUsers />
      </div>
    </RoleGuard>
  );
}
