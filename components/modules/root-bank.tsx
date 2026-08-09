'use client';

import * as React from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Flame,
  Landmark,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useRootBankBudgets, useRootBankExpenses, useRootBankBalance } from '@/lib/queries';
import { BUDGET_STATUS_LABELS, EXPENSE_CATEGORIES } from '@/lib/constants';
import { formatMoney, cn, toBengaliDigits, formatDate } from '@/lib/utils';
import { storageUrl } from '@/lib/supabase/client';
import type { RootBankBudget, RootBankExpense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BudgetForm } from '@/components/forms/budget-form';
import { ExpenseForm } from '@/components/forms/expense-form';
import { Dialog } from '@/components/ui/dialog';
import { Stagger, StaggerItem } from '@/components/ui/motion';

/* ── Balance card ─────────────────────────────────────────────────────── */

function BalanceCard() {
  const { data: balance } = useRootBankBalance();

  const allocated = Number(balance?.allocated ?? 0);
  const spent = Number(balance?.spent ?? 0);
  const remaining = Math.max(allocated - spent, 0);
  const pct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
  const barColor = pct < 60 ? 'bg-sage-500' : pct < 85 ? 'bg-amber-500' : 'bg-warmred-500';

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-secondary/60 p-5 shadow-soft theme-surface sm:p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Landmark className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">রুট ব্যাংক ব্যালেন্স</p>
          <p className="truncate text-xs text-muted-foreground">বাজেট বরাদ্দ ও ব্যয়</p>
        </div>
      </div>

      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground leading-none">
          {toBengaliDigits(pct)}% ব্যবহৃত
        </p>
        <p className="text-xs text-muted-foreground tabular-nums leading-none">
          {formatMoney(spent)} / {formatMoney(allocated)}
        </p>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-700', barColor)} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <span className="text-muted-foreground tabular-nums">
          অবশিষ্ট · <span className="font-semibold text-sage-600 dark:text-sage-400">{formatMoney(remaining)}</span>
        </span>
        <span className="text-muted-foreground tabular-nums text-center">
          বরাদ্দ · <span className="font-semibold">{formatMoney(allocated)}</span>
        </span>
        <span className="text-muted-foreground tabular-nums text-right">
          ব্যয় · <span className="font-semibold">{formatMoney(spent)}</span>
        </span>
      </div>
    </div>
  );
}

/* ── Budgets ───────────────────────────────────────────────────────────── */

function RootBankBudgetsSection() {
  const qc = useQueryClient();
  const { data: budgets, isLoading } = useRootBankBudgets(true);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RootBankBudget | null>(null);

  const handleDelete = async (b: RootBankBudget) => {
    if (!confirm(`রুট ব্যাংক বাজেট "${b.project_name}" মুছে ফেলবেন?`)) return;
    const { error } = await supabase.from('root_bank_budgets').delete().eq('id', b.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('রুট ব্যাংক বাজেট মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['root-bank-budgets'] });
      qc.invalidateQueries({ queryKey: ['root-bank-balance'] });
    }
  };

  return (
    <section aria-labelledby="root-bank-budgets-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/75">বাজেট</p>
          <h2 id="root-bank-budgets-title" className="mt-1 text-xl font-bold tracking-tight">রুট ব্যাংক বাজেট</h2>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus /> নতুন বাজেট
        </Button>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && (!budgets || budgets.length === 0) && (
        <EmptyState title="কোনো বাজেট নেই" description="রুট ব্যাংকে নতুন বাজেট যোগ করুন।" icon={<Landmark className="h-7 w-7" />} />
      )}

      {budgets && budgets.length > 0 && (
        <Stagger className="grid gap-4 md:grid-cols-2">
          {budgets.map((b) => {
            const allocated = Number(b.allocated_amount);
            const spent = Number(b.spent_amount);
            const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
            const remaining = allocated - spent;
            const barColor = pct > 95 ? 'bg-warmred-500' : pct >= 75 ? 'bg-amber-500' : 'bg-sage-500';
            const isCritical = pct > 95;
            const isWarning = pct >= 80 && pct <= 95;
            return (
              <StaggerItem
                key={b.id}
                className={cn(
                  'rounded-xl2 border bg-card p-5 shadow-soft transition-colors',
                  isCritical
                    ? 'border-warmred-300 dark:border-warmred-700 bg-warmred-50/30 dark:bg-warmred-950/20'
                    : isWarning
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20'
                      : 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{b.project_name}</h3>
                    <p className="text-xs text-muted-foreground">{b.description || '—'}</p>
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
                <div className="mt-1 flex items-center justify-between">
                  {isCritical ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-warmred-600 dark:text-warmred-400">
                      <Flame className="h-3 w-3" />
                      বাজেট অতিক্রান্ত!
                    </span>
                  ) : isWarning ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      সতর্কতা: ৮০%+ ব্যয় হয়েছে
                    </span>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-muted-foreground">{toBengaliDigits(pct.toFixed(1))}% ব্যয় হয়েছে</p>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(b);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil /> সম্পাদনা
                  </Button>
                  <Button variant="ghost" size="sm" className="text-warmred-500" onClick={() => handleDelete(b)}>
                    <Trash2 /> মুছুন
                  </Button>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <BudgetForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        budget={editing}
        table="root_bank_budgets"
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['root-bank-budgets'] });
          qc.invalidateQueries({ queryKey: ['root-bank-balance'] });
        }}
      />
    </section>
  );
}

/* ── Expenses ──────────────────────────────────────────────────────────── */

function RootBankExpensesSection() {
  const qc = useQueryClient();
  const { data: expenses, isLoading } = useRootBankExpenses(true);

  const [category, setCategory] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RootBankExpense | null>(null);
  const [receipt, setReceipt] = React.useState<string | null>(null);

  const filtered = React.useMemo(
    () => (expenses ?? []).filter((e) => !category || e.category === category),
    [expenses, category]
  );
  const total = React.useMemo(() => filtered.reduce((s, e) => s + Number(e.amount), 0), [filtered]);

  const handleDelete = async (e: RootBankExpense) => {
    if (!confirm(`রুট ব্যাংক ব্যয় "${e.title}" মুছে ফেলবেন?`)) return;
    const { error } = await supabase.from('root_bank_expenses').delete().eq('id', e.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('রুট ব্যাংক ব্যয় মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['root-bank-expenses'] });
      qc.invalidateQueries({ queryKey: ['root-bank-budgets'] });
      qc.invalidateQueries({ queryKey: ['root-bank-balance'] });
    }
  };

  return (
    <section aria-labelledby="root-bank-expenses-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/75">ব্যয়</p>
          <h2 id="root-bank-expenses-title" className="mt-1 text-xl font-bold tracking-tight">রুট ব্যাংক ব্যয়</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-40">
            <option value="">সব বিভাগ</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <span className="text-sm text-muted-foreground">
            মোট: <span className="font-semibold text-coffee-700">{formatMoney(total)}</span>
          </span>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> ব্যয় যোগ করুন
          </Button>
        </div>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState title="কোনো ব্যয় রেকর্ড নেই" description="রুট ব্যাংকে নতুন ব্যয় যোগ করুন।" icon={<Receipt className="h-7 w-7" />} />
      )}

      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>তারিখ</TableHead>
                <TableHead>শিরোনাম</TableHead>
                <TableHead>বিভাগ</TableHead>
                <TableHead className="text-right">পরিমাণ</TableHead>
                <TableHead>রসিদ</TableHead>
                <TableHead>যিনি তৈরি করেছেন</TableHead>
                <TableHead className="text-right">কার্যক্রম</TableHead>
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
                        <Receipt /> দেখুন
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.profiles?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(e); setFormOpen(true); }}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-warmred-500" onClick={() => handleDelete(e)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ExpenseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        expense={editing}
        table="root_bank_expenses"
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['root-bank-expenses'] });
          qc.invalidateQueries({ queryKey: ['root-bank-budgets'] });
          qc.invalidateQueries({ queryKey: ['root-bank-balance'] });
        }}
      />

      <Dialog open={!!receipt} onClose={() => setReceipt(null)} title="রসিদ">
        {receipt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={storageUrl(receipt)} alt="Receipt" className="w-full rounded-lg" loading="lazy" decoding="async" />
        )}
      </Dialog>
    </section>
  );
}

/* ── Page module ───────────────────────────────────────────────────────── */

export function RootBank() {
  return (
    <Stagger className="space-y-10">
      <StaggerItem>
        <BalanceCard />
      </StaggerItem>
      <StaggerItem>
        <RootBankBudgetsSection />
      </StaggerItem>
      <StaggerItem>
        <RootBankExpensesSection />
      </StaggerItem>
    </Stagger>
  );
}
