'use client';

import * as React from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Landmark,
  PiggyBank,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useRootBankDeposits, useRootBankExpenses, useRootBankBalance } from '@/lib/queries';
import { formatMoney, cn, toBengaliDigits, formatDateTime } from '@/lib/utils';
import { storageUrl } from '@/lib/supabase/client';
import type { RootBankDeposit, RootBankExpense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RootBankDepositForm } from '@/components/forms/root-bank-deposit-form';
import { RootBankExpenseForm } from '@/components/forms/root-bank-expense-form';
import { Dialog } from '@/components/ui/dialog';
import { Stagger, StaggerItem } from '@/components/ui/motion';

/* ── Balance card (deposits − expenses) ────────────────────────────────── */

function BalanceCard() {
  const { data: balance } = useRootBankBalance();

  const deposits = Number(balance?.deposits ?? 0);
  const spent = Number(balance?.spent ?? 0);
  const remaining = deposits - spent;
  const pct = deposits > 0 ? Math.min(100, Math.round((spent / deposits) * 100)) : 0;
  const barColor = pct < 60 ? 'bg-sage-500' : pct < 85 ? 'bg-amber-500' : 'bg-warmred-500';

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-secondary/60 p-5 shadow-soft theme-surface sm:p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Landmark className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">রুট ব্যাংক ব্যালেন্স</p>
          <p className="truncate text-xs text-muted-foreground">জমা ও ব্যয়</p>
        </div>
      </div>

      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground leading-none">
          {toBengaliDigits(pct)}% ব্যবহৃত
        </p>
        <p className="text-xs text-muted-foreground tabular-nums leading-none">
          {formatMoney(spent)} / {formatMoney(deposits)}
        </p>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-700', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <span className="text-muted-foreground tabular-nums">
          অবশিষ্ট ·{' '}
          <span className={cn('font-semibold', remaining < 0 ? 'text-warmred-500' : 'text-sage-600 dark:text-sage-400')}>
            {formatMoney(remaining)}
          </span>
        </span>
        <span className="text-muted-foreground tabular-nums text-center">
          জমা · <span className="font-semibold">{formatMoney(deposits)}</span>
        </span>
        <span className="text-muted-foreground tabular-nums text-right">
          ব্যয় · <span className="font-semibold">{formatMoney(spent)}</span>
        </span>
      </div>
    </div>
  );
}

/* ── Deposits ──────────────────────────────────────────────────────────── */

function RootBankDepositsSection() {
  const qc = useQueryClient();
  const { data: deposits, isLoading } = useRootBankDeposits(true);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RootBankDeposit | null>(null);

  const total = React.useMemo(
    () => (deposits ?? []).reduce((s, d) => s + Number(d.amount), 0),
    [deposits]
  );

  const handleDelete = async (d: RootBankDeposit) => {
    if (!confirm(`জমা "${d.title}" মুছে ফেলবেন?`)) return;
    const { error } = await supabase.from('root_bank_deposits').delete().eq('id', d.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('জমা মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['root-bank-deposits'] });
      qc.invalidateQueries({ queryKey: ['root-bank-balance'] });
    }
  };

  return (
    <section aria-labelledby="root-bank-deposits-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/75">জমা</p>
          <h2 id="root-bank-deposits-title" className="mt-1 text-xl font-bold tracking-tight">রুট ব্যাংক জমা</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">
            মোট: <span className="font-semibold text-sage-600 dark:text-sage-400">{formatMoney(total)}</span>
          </span>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> জমা যোগ করুন
          </Button>
        </div>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && (!deposits || deposits.length === 0) && (
        <EmptyState
          title="কোনো জমা নেই"
          description="রুট ব্যাংকে নতুন জমা যোগ করুন।"
          icon={<PiggyBank className="h-7 w-7" />}
        />
      )}

      {deposits && deposits.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>তারিখ ও সময়</TableHead>
                <TableHead>শিরোনাম / রেফারেন্স</TableHead>
                <TableHead className="text-right">পরিমাণ</TableHead>
                <TableHead>যিনি যোগ করেছেন</TableHead>
                <TableHead className="text-right">কার্যক্রম</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(d.deposited_at)}</TableCell>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-sage-600 dark:text-sage-400">
                    {formatMoney(Number(d.amount))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.profiles?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(d); setFormOpen(true); }}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-warmred-500" onClick={() => handleDelete(d)}>
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

      <RootBankDepositForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        deposit={editing}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['root-bank-deposits'] });
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

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RootBankExpense | null>(null);
  const [receipt, setReceipt] = React.useState<string | null>(null);

  const total = React.useMemo(
    () => (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );

  const handleDelete = async (e: RootBankExpense) => {
    if (!confirm(`রুট ব্যাংক ব্যয় "${e.title}" মুছে ফেলবেন?`)) return;
    const { error } = await supabase.from('root_bank_expenses').delete().eq('id', e.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('রুট ব্যাংক ব্যয় মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['root-bank-expenses'] });
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

      {!isLoading && (expenses ?? []).length === 0 && (
        <EmptyState
          title="কোনো ব্যয় রেকর্ড নেই"
          description="রুট ব্যাংকে নতুন ব্যয় যোগ করুন।"
          icon={<Receipt className="h-7 w-7" />}
        />
      )}

      {(expenses ?? []).length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>তারিখ ও সময়</TableHead>
                <TableHead>শিরোনাম / রেফারেন্স</TableHead>
                <TableHead className="text-right">পরিমাণ</TableHead>
                <TableHead>রসিদ</TableHead>
                <TableHead>যিনি তৈরি করেছেন</TableHead>
                <TableHead className="text-right">কার্যক্রম</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(expenses ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(e.expensed_at)}</TableCell>
                  <TableCell className="font-medium">{e.title}</TableCell>
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

      <RootBankExpenseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        expense={editing}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['root-bank-expenses'] });
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
        <RootBankDepositsSection />
      </StaggerItem>
      <StaggerItem>
        <RootBankExpensesSection />
      </StaggerItem>
    </Stagger>
  );
}
