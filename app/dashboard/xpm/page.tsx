'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Seo } from '@/components/seo';
import { Expenses } from '@/components/modules/expenses';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardExpensesPage() {
  return (
    <RoleGuard allowedRoles={['root', 'pr', 'vp', 'admin', 'gs', 'tr', 'ofs', 'ors', 'rds']}>
      <div className="space-y-5">
        <Seo title="ব্যয় ব্যবস্থাপনা" />
        <PageHeader size="md" title="ব্যয় ব্যবস্থাপনা" description="ক্লাবের খরচ ট্র্যাক করুন। সব পরিবর্তন নিরীক্ষিত হয়।" />
        <Expenses />
      </div>
    </RoleGuard>
  );
}
