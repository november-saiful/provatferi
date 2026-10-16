'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Seo } from '@/components/seo';
import { RoleSupervise } from '@/components/modules/role-supervise';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAdminRolesPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'admin', 'root']}>
      <div className="space-y-5">
        <Seo title="রোল সুপারভাইজ" />
        <PageHeader size="md" title="রোল সুপারভাইজ" description="ভূমিকা অনুযায়ী অনুমতি ও ক্ষমতা দেখুন ও পরিচালনা করুন।" />
        <RoleSupervise />
      </div>
    </RoleGuard>
  );
}
