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
import { formatDate, formatMoney, cn, toBengaliDigits } from '@/lib/utils';
import type { Expense } from '@/lib/types';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
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
  const [sortKey, setSortKey] = React.useState<'expense_date' | 'title' | 'category' | 'amount'>('expense_date');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 25;

  const canCreate = canWrite(role, 'xpm');
  const canEdit = canEditExpense(role);

  const filtered = React.useMemo(
    () => (expenses ?? []).filter((e) => !category || e.category === category),
    [expenses, category]
  );

  const sorted = React.useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'amount') return (Number(a.amount) - Number(b.amount)) * dir;
      const av = String(a[sortKey] ?? '').toLowerCase();
      const bv = String(b[sortKey] ?? '').toLowerCase();
      return av.localeCompare(bv) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = React.useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);

  React.useEffect(() => {
    setPage(1);
  }, [category]);

  const toggleSort = (key: typeof sortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'expense_date' || key === 'amount' ? 'desc' : 'asc');
    }
  };

  const total = React.useMemo(() => filtered.reduce((s, e) => s + Number(e.amount), 0), [filtered]);

  const SortHeader = ({
    label,
    k,
    className
  }: {
    label: string;
    k: typeof sortKey;
    className?: string;
  }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className={cn('inline-flex items-center gap-1 hover:text-foreground', className)}
    >
      {label}
      {sortKey === k ? (
        sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );

  const handleDelete = async (e: Expense) => {
    if (!confirm(`ব্যয় "${e.title}" মুছে ফেলবেন? এটি অডিট ট্রেইলে রেকর্ড হবে।`)) return;
    const { error } = await supabase.from('expenses').delete().eq('id', e.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('ব্যয় মুছে ফেলা হয়েছে — মূল স্রষ্টাকে জানানো হয়েছে');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['records'] });
    }
  };

  return (
    <Stagger className="space-y-5">
      <StaggerItem className="flex flex-wrap items-center gap-3">
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-48">
          <option value="">সব বিভাগ</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            মোট: <span className="font-semibold text-coffee-700">{formatMoney(total)}</span>
          </span>
          {canCreate && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> ব্যয় যোগ করুন
            </Button>
          )}
        </div>
      </StaggerItem>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState title="কোনো ব্যয় রেকর্ড নেই" description="আপনি যে ব্যয় দেখতে পারেন তা এখানে দেখা যাবে।" />
      )}

      {filtered.length > 0 && (
        <StaggerItem>
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortHeader label="তারিখ" k="expense_date" /></TableHead>
              <TableHead><SortHeader label="শিরোনাম" k="title" /></TableHead>
              <TableHead><SortHeader label="বিভাগ" k="category" /></TableHead>
              <TableHead className="text-right"><SortHeader label="পরিমাণ" k="amount" className="justify-end" /></TableHead>
              <TableHead>রসিদ</TableHead>
              <TableHead>যিনি তৈরি করেছেন</TableHead>
              <TableHead className="text-right">কার্যক্রম</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((e) => (
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
                      <Receipt /> দেখুন
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{e.profiles?.full_name ?? 'কমিটি'}</TableCell>
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

      {filtered.length > PAGE_SIZE && (
        <StaggerItem className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            পৃষ্ঠা {toBengaliDigits(page)} / {toBengaliDigits(pageCount)} · {toBengaliDigits(filtered.length)} ব্যয়
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              আগের
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
              পরের
            </Button>
          </div>
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

      <Dialog open={!!receipt} onClose={() => setReceipt(null)} title="রসিদ">
        {receipt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={storageUrl(receipt)} alt="Receipt" className="w-full rounded-lg" loading="lazy" decoding="async" />
        )}
      </Dialog>
    </Stagger>
  );
}
