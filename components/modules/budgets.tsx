'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useBudgets } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canWrite, canEditBudget } from '@/lib/permissions';
import { BUDGET_STATUS_LABELS } from '@/lib/constants';
import { formatMoney, cn, toBengaliDigits } from '@/lib/utils';
import type { Budget } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BudgetForm } from '@/components/forms/budget-form';
import { Badge } from '@/components/ui/badge';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export function Budgets() {
  const qc = useQueryClient();
  const { role } = useAuthStore();
  const { data: budgets, isLoading } = useBudgets(true);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Budget | null>(null);

  const canCreate = canWrite(role, 'bgm');
  const canEdit = canEditBudget(role);

  const handleDelete = async (b: Budget) => {
    if (!confirm(`বাজেট "${b.project_name}" মুছে ফেলবেন?`)) return;
    const { error } = await supabase.from('budgets').delete().eq('id', b.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('বাজেট মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['records'] });
    }
  };

  return (
    <Stagger className="space-y-5">
      <StaggerItem className="flex justify-end">
        {canCreate && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> নতুন বাজেট
          </Button>
        )}
      </StaggerItem>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && (!budgets || budgets.length === 0) && (
        <EmptyState title="কোনো বাজেট নেই" description="প্রকল্পের বাজেট এখানে দেখা যাবে।" />
      )}

      {budgets && budgets.length > 0 && (
        <Stagger className="grid gap-4 md:grid-cols-2">
          {budgets.map((b) => {
            const allocated = Number(b.allocated_amount);
            const spent = Number(b.spent_amount);
            const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
            const remaining = allocated - spent;
            const barColor =
              pct > 95 ? 'bg-warmred-500' : pct >= 75 ? 'bg-amber-500' : 'bg-sage-500';
            return (
              <StaggerItem key={b.id} className="rounded-xl2 border border-border bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{b.project_name}</h3>
                    <p className="text-xs text-muted-foreground">{BUDGET_STATUS_LABELS[b.status] ?? b.status}</p>
                  </div>
                  <Badge variant={b.status === 'active' ? 'coffee' : b.status === 'completed' ? 'success' : 'secondary'}>
                    {BUDGET_STATUS_LABELS[b.status] ?? b.status}
                  </Badge>
                </div>

                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">বরাদ্দ</span>
                    <span className="font-medium">{formatMoney(allocated)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ব্যয়</span>
                    <span className="font-medium">{formatMoney(spent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">অবশিষ্ট</span>
                    <span className={cn('font-semibold', remaining < 0 ? 'text-warmred-500' : 'text-sage-600')}>
                      {formatMoney(remaining)}
                    </span>
                  </div>
                </div>

                <Progress value={pct} className="mt-3" barClassName={barColor} />
                <p className="mt-1 text-right text-xs text-muted-foreground">{toBengaliDigits(pct.toFixed(1))}% ব্যয় হয়েছে</p>

                {b.description && <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>}

                {canEdit && (
                  <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(b); setFormOpen(true); }}>
                      <Pencil /> সম্পাদনা
                    </Button>
                    <Button variant="ghost" size="sm" className="text-warmred-500" onClick={() => handleDelete(b)}>
                      <Trash2 /> মুছুন
                    </Button>
                  </div>
                )}
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <BudgetForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        budget={editing}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['budgets'] });
          qc.invalidateQueries({ queryKey: ['records'] });
        }}
      />
    </Stagger>
  );
}
