'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Budgets } from '@/components/modules/budgets';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardBudgetsPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'cs', 'acs', 'rds']}>
      <div className="space-y-5">
        <PageHeader size="md" title="বাজেট ব্যবস্থাপনা" description="প্রকল্পের বাজেট পরিকল্পনা ও পর্যবেক্ষণ করুন।" />
        <Budgets />
      </div>
    </RoleGuard>
  );
}
