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
  title: z.string().min(2, 'শিরোনাম প্রয়োজন'),
  amount: z.coerce.number().min(0.01, 'পরিমাণ লিখুন'),
  category: z.string().optional(),
  description: z.string().optional(),
  expense_date: z.string().min(1, 'তারিখ প্রয়োজন')
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
        description: values.description || null,
        receipt_url: receiptUrl,
        expense_date: values.expense_date,
        ...(expense ? {} : { created_by: user.id })
      };
      if (expense) {
        const { error } = await supabase.from('expenses').update(payload).eq('id', expense.id);
        if (error) throw error;
        toast.success('ব্যয় আপডেট হয়েছে — মূল স্রষ্টাকে জানানো হয়েছে');
      } else {
        const { error } = await supabase.from('expenses').insert(payload);
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
