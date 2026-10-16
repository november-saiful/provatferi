'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RootBankExpense } from '@/lib/types';

const schema = z.object({
  title: z.string().min(2, 'শিরোনাম / রেফারেন্স লিখুন'),
  amount: z.coerce.number().min(0.01, 'পরিমাণ লিখুন')
});

type FormValues = z.infer<typeof schema>;

export function RootBankExpenseForm({
  open,
  onClose,
  onSaved,
  expense
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  expense?: RootBankExpense | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', amount: 0 }
  });

  React.useEffect(() => {
    if (open) {
      reset({ title: expense?.title ?? '', amount: expense?.amount ?? 0 });
    }
  }, [open, expense, reset]);

  const onSubmit = async (values: FormValues) => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error('সাইন ইন প্রয়োজন');
      return;
    }
    try {
      const payload = {
        title: values.title,
        amount: values.amount,
        // Date & time are stamped automatically at submission time.
        expensed_at: new Date().toISOString(),
        ...(expense ? {} : { created_by: user.id })
      };
      if (expense) {
        const { error } = await supabase.from('root_bank_expenses').update(payload).eq('id', expense.id);
        if (error) throw error;
        toast.success('ব্যয় আপডেট হয়েছে');
      } else {
        const { error } = await supabase.from('root_bank_expenses').insert(payload);
        if (error) throw error;
        toast.success('ব্যয় রেকর্ড হয়েছে');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ব্যয় সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={expense ? 'ব্যয় সম্পাদনা' : 'ব্যয় যোগ করুন'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rx-title">শিরোনাম / রেফারেন্স</Label>
          <Input id="rx-title" {...register('title')} placeholder="যেমন: যন্ত্রপাতি কেনা, অনুষ্ঠান খরচ…" />
          {errors.title && <p className="text-xs text-warmred-500">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rx-amount">পরিমাণ (টাকা)</Label>
          <Input id="rx-amount" type="number" step="0.01" min="0" {...register('amount')} />
          {errors.amount && <p className="text-xs text-warmred-500">{errors.amount.message}</p>}
        </div>
        <p className="text-xs text-muted-foreground">তারিখ ও সময় স্বয়ংক্রিয়ভাবে রেকর্ড হবে।</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>বাতিল</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'সংরক্ষণ হচ্ছে…' : expense ? 'পরিবর্তন সংরক্ষণ' : 'ব্যয় যোগ করুন'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
