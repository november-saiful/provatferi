'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Expenses } from '@/components/modules/expenses';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardExpensesPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'gs', 'tr', 'ofs', 'ors', 'rds']}>
      <div className="space-y-5">
        <PageHeader size="md" title="ব্যয় ব্যবস্থাপনা" description="ক্লাবের খরচ ট্র্যাক করুন। সব পরিবর্তন নিরীক্ষিত হয়।" />
        <Expenses />
      </div>
    </RoleGuard>
  );
}
