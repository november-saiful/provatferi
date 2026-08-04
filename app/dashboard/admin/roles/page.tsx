'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Seo } from '@/components/seo';
import { AdminRoles } from '@/components/modules/admin-roles';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAdminRolesPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'admin', 'root']}>
      <div className="space-y-5">
        <Seo title="ভূমিকা অনুমতি" />
        <PageHeader size="md" title="ভূমিকা অনুমতি" description="ভূমিকা অনুযায়ী মডিউল অ্যাক্সেসের রেফারেন্স ভিউ।" />
        <AdminRoles />
      </div>
    </RoleGuard>
  );
}
