'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Expenses } from '@/components/modules/expenses';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardExpensesPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'gs', 'tr', 'ofs', 'ors', 'rds']}>
      <div className="space-y-5">
        <PageHeader size="md" title="Expense management" description="Track club expenditures. All changes are audited." />
        <Expenses />
      </div>
    </RoleGuard>
  );
}
