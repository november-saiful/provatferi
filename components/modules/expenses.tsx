'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Receipt, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useExpenses } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canWrite, canEditExpense } from '@/lib/permissions';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { storageUrl } from '@/lib/supabase/client';
import { formatDate, formatMoney } from '@/lib/utils';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExpenseForm } from '@/components/forms/expense-form';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export function Expenses() {
  const qc = useQueryClient();
  const { role, user } = useAuthStore();
  const { data: expenses, isLoading } = useExpenses(true);

  const [category, setCategory] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Expense | null>(null);
  const [receipt, setReceipt] = React.useState<string | null>(null);

  const canCreate = canWrite(role, 'xpm');
  const canEdit = canEditExpense(role);

  const filtered = React.useMemo(
    () => (expenses ?? []).filter((e) => !category || e.category === category),
    [expenses, category]
  );

  const total = React.useMemo(() => filtered.reduce((s, e) => s + Number(e.amount), 0), [filtered]);

  const handleDelete = async (e: Expense) => {
    if (!confirm(`Delete expense "${e.title}"? This is logged in the audit trail.`)) return;
    const { error } = await supabase.from('expenses').delete().eq('id', e.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Expense deleted — original creator notified');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['records'] });
    }
  };

  return (
    <Stagger className="space-y-5">
      <StaggerItem className="flex flex-wrap items-center gap-3">
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-48">
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-coffee-700">{formatMoney(total)}</span>
          </span>
          {canCreate && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> Add expense
            </Button>
          )}
        </div>
      </StaggerItem>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState title="No expenses recorded" description="Expenses you can view will appear here." />
      )}

      {filtered.length > 0 && (
        <StaggerItem>
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(e.expense_date)}</TableCell>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell>
                  {e.category && <Badge variant="coffee">{e.category}</Badge>}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold text-coffee-700">{formatMoney(Number(e.amount))}</TableCell>
                <TableCell>
                  {e.receipt_url ? (
                    <Button variant="ghost" size="sm" onClick={() => setReceipt(e.receipt_url!)}>
                      <Receipt /> View
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{e.profiles?.full_name ?? 'Committee'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {(canEdit || user?.id === e.created_by) && (
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(e); setFormOpen(true); }}>
                        <Pencil />
                      </Button>
                    )}
                    {canEdit && (
                      <Button variant="ghost" size="sm" className="text-warmred-500" onClick={() => handleDelete(e)}>
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </StaggerItem>
      )}

      <ExpenseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        expense={editing}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['expenses'] });
          qc.invalidateQueries({ queryKey: ['records'] });
        }}
      />

      <Dialog open={!!receipt} onClose={() => setReceipt(null)} title="Receipt">
        {receipt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={storageUrl(receipt)} alt="Receipt" className="w-full rounded-lg" loading="lazy" decoding="async" />
        )}
      </Dialog>
    </Stagger>
  );
}
