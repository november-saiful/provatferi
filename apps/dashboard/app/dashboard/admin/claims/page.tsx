'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Seo } from '@/components/seo';
import { AlumniClaims } from '@/components/modules/alumni-claims';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAdminClaimsPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'admin', 'root']}>
      <div className="space-y-5">
        <Seo title="অ্যালামনাই দাবি" />
        <PageHeader size="md" title="অ্যালামনাই দাবি" description="প্রাক্তন সদস্যদের প্রোফাইল দাবি পর্যালোচনা ও অনুমোদন করুন।" />
        <AlumniClaims />
      </div>
    </RoleGuard>
  );
}
