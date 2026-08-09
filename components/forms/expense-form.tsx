'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/upload';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { useBudgets, useRootBankBudgets } from '@/lib/queries';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import type { Expense, RootBankExpense } from '@/lib/types';

type ExpenseTable = 'expenses' | 'root_bank_expenses';

const schema = z.object({
  title: z.string().min(2, 'শিরোনাম প্রয়োজন'),
  amount: z.coerce.number().min(0.01, 'পরিমাণ লিখুন'),
  category: z.string().optional(),
  budget_id: z.string().optional(),
  description: z.string().optional(),
  expense_date: z.string().min(1, 'তারিখ প্রয়োজন')
});

type FormValues = z.infer<typeof schema>;

export function ExpenseForm({
  open,
  onClose,
  onSaved,
  expense,
  table = 'expenses'
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  expense?: Expense | RootBankExpense | null;
  /** Which table to write to — `expenses` (club) or `root_bank_expenses` (Root Bank). */
  table?: ExpenseTable;
}) {
  const [receipt, setReceipt] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const { data: clubBudgets } = useBudgets(open && table === 'expenses');
  const { data: rootBankBudgets } = useRootBankBudgets(open && table === 'root_bank_expenses');
  const budgets = table === 'root_bank_expenses' ? rootBankBudgets : clubBudgets;

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', amount: 0, category: '', budget_id: '', description: '', expense_date: new Date().toISOString().slice(0, 10) }
  });

  React.useEffect(() => {
    if (open) {
      reset({
        title: expense?.title ?? '',
        amount: expense?.amount ?? 0,
        category: expense?.category ?? '',
        budget_id: expense?.budget_id ?? '',
        description: expense?.description ?? '',
        expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10)
      });
      setReceipt(null);
    }
  }, [open, expense, reset]);

  // Auto-suggest a budget when the category changes: find the first active
  // budget whose project_name contains the category (case-insensitive).
  const categoryValue = useWatch({ name: 'category', control });
  React.useEffect(() => {
    if (!budgets || !categoryValue) return;
    // Don't override if user already picked a budget manually
    const currentBudget = getValues('budget_id');
    if (currentBudget) return;
    const match = budgets
      .filter((b) => b.status === 'active')
      .find((b) => b.project_name.toLowerCase().includes(String(categoryValue).toLowerCase()));
    if (match) {
      setValue('budget_id', match.id, { shouldValidate: true });
    }
  }, [categoryValue, budgets]);

  const onSubmit = async (values: FormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('সাইন ইন প্রয়োজন');
      return;
    }
    setUploading(true);
    try {
      let receiptUrl: string | null = expense?.receipt_url ?? null;
      if (receipt) {
        receiptUrl = await uploadImage(receipt, 'receipts');
      }
      const payload = {
        title: values.title,
        amount: values.amount,
        category: values.category || null,
        budget_id: values.budget_id || null,
        description: values.description || null,
        receipt_url: receiptUrl,
        expense_date: values.expense_date,
        ...(expense ? {} : { created_by: user.id })
      };
      if (expense) {
        const { error } = await supabase.from(table).update(payload).eq('id', expense.id);
        if (error) throw error;
        toast.success('ব্যয় আপডেট হয়েছে');
      } else {
        const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
        toast.success('ব্যয় রেকর্ড হয়েছে');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ব্যয় সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={expense ? 'ব্যয় সম্পাদনা' : 'ব্যয় রেকর্ড'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="x-title">শিরোনাম</Label>
          <Input id="x-title" {...register('title')} placeholder="ব্যয়টি কীসের জন্য ছিল?" />
          {errors.title && <p className="text-xs text-warmred-500">{errors.title.message}</p>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="x-amount">পরিমাণ (টাকা)</Label>
            <Input id="x-amount" type="number" step="0.01" min="0" {...register('amount')} />
            {errors.amount && <p className="text-xs text-warmred-500">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="x-category">বিভাগ</Label>
            <Select id="x-category" {...register('category')}>
              <option value="">নির্বাচন করুন…</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>
        {budgets && budgets.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="x-budget">বাজেট (ঐচ্ছিক)</Label>
            <Select id="x-budget" {...register('budget_id')}>
              <option value="">কোনো বাজেট নয়</option>
              {budgets.filter((b) => b.status === 'active').map((b) => (
                <option key={b.id} value={b.id}>{b.project_name}</option>
              ))}
            </Select>
            <p className="text-[11px] text-muted-foreground">বাজেট নির্বাচন করলে বাজেটের ব্যয় স্বয়ংক্রিয়ভাবে আপডেট হবে।</p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="x-date">ব্যয়ের তারিখ</Label>
          <Input id="x-date" type="date" {...register('expense_date')} />
          {errors.expense_date && <p className="text-xs text-warmred-500">{errors.expense_date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="x-desc">বিবরণ</Label>
          <Textarea id="x-desc" rows={3} {...register('description')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="x-receipt">রসিদের ছবি (ঐচ্ছিক)</Label>
          <Input id="x-receipt" type="file" accept="image/*" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>বাতিল</Button>
          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting || uploading ? 'সংরক্ষণ হচ্ছে…' : expense ? 'পরিবর্তন সংরক্ষণ' : 'ব্যয় রেকর্ড'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
