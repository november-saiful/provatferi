'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Budgets } from '@/components/modules/budgets';

export default function DashboardBudgetsPage() {
  return (
    <RoleGuard allowedRoles={['pr', 'vp', 'cs', 'acs', 'rds']}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Budget management</h1>
          <p className="text-sm text-muted-foreground">Plan and monitor project budgets.</p>
        </div>
        <Budgets />
      </div>
    </RoleGuard>
  );
}
