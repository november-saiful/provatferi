'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Seo } from '@/components/seo';
import { Budgets } from '@/components/modules/budgets';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardBudgetsPage() {
  return (
    <RoleGuard allowedRoles={['root', 'pr', 'vp', 'admin', 'cs', 'acs', 'rds']}>
      <div className="space-y-5">
        <Seo title="বাজেট ব্যবস্থাপনা" />
        <PageHeader size="md" title="বাজেট ব্যবস্থাপনা" description="প্রকল্পের বাজেট পরিকল্পনা ও পর্যবেক্ষণ করুন।" />
        <Budgets />
      </div>
    </RoleGuard>
  );
}
