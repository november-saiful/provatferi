'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/upload';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import type { Expense } from '@/lib/types';

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  amount: z.coerce.number().min(0.01, 'Enter an amount'),
  category: z.string().optional(),
  description: z.string().optional(),
  expense_date: z.string().min(1, 'Date is required')
});

type FormValues = z.infer<typeof schema>;

export function ExpenseForm({
  open,
  onClose,
  onSaved,
  expense
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  expense?: Expense | null;
}) {
  const [receipt, setReceipt] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', amount: 0, category: '', description: '', expense_date: new Date().toISOString().slice(0, 10) }
  });

  React.useEffect(() => {
    if (open) {
      reset({
        title: expense?.title ?? '',
        amount: expense?.amount ?? 0,
        category: expense?.category ?? '',
        description: expense?.description ?? '',
        expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10)
      });
      setReceipt(null);
    }
  }, [open, expense, reset]);

  const onSubmit = async (values: FormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sign in required');
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
        description: values.description || null,
        receipt_url: receiptUrl,
        expense_date: values.expense_date,
        ...(expense ? {} : { created_by: user.id })
      };
      if (expense) {
        const { error } = await supabase.from('expenses').update(payload).eq('id', expense.id);
        if (error) throw error;
        toast.success('Expense updated — original creator notified');
      } else {
        const { error } = await supabase.from('expenses').insert(payload);
        if (error) throw error;
        toast.success('Expense recorded');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={expense ? 'Edit expense' : 'Record expense'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="x-title">Title</Label>
          <Input id="x-title" {...register('title')} placeholder="What was the expense?" />
          {errors.title && <p className="text-xs text-warmred-500">{errors.title.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="x-amount">Amount (BDT)</Label>
            <Input id="x-amount" type="number" step="0.01" min="0" {...register('amount')} />
            {errors.amount && <p className="text-xs text-warmred-500">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="x-category">Category</Label>
            <Select id="x-category" {...register('category')}>
              <option value="">Select…</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="x-date">Expense date</Label>
          <Input id="x-date" type="date" {...register('expense_date')} />
          {errors.expense_date && <p className="text-xs text-warmred-500">{errors.expense_date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="x-desc">Description</Label>
          <Textarea id="x-desc" rows={3} {...register('description')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="x-receipt">Receipt image (optional)</Label>
          <Input id="x-receipt" type="file" accept="image/*" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting || uploading ? 'Saving…' : expense ? 'Save changes' : 'Record expense'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
