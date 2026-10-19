'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Seo } from '@/components/seo';
import { RecruitmentSettingsPanel } from '@/components/modules/recruitment-settings';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAdminRecruitmentPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'admin', 'root']}>
      <div className="space-y-5">
        <Seo title="রিক্রুটমেন্ট সেটিংস" />
        <PageHeader
          size="md"
          title="রিক্রুটমেন্ট সেটিংস"
          description="রিক্রুটমেন্ট পর্ব চালু/বন্ধ করুন এবং শুরুর ও শেষের সময় নির্ধারণ করুন।"
        />
        <RecruitmentSettingsPanel />
      </div>
    </RoleGuard>
  );
}
