'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Expenses } from '@/components/modules/expenses';

export default function DashboardExpensesPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'gs', 'tr', 'ofs', 'ors', 'rds']}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Expense management</h1>
          <p className="text-sm text-muted-foreground">Track club expenditures. All changes are audited.</p>
        </div>
        <Expenses />
      </div>
    </RoleGuard>
  );
}
