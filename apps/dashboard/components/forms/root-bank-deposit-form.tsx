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
import type { RootBankDeposit } from '@/lib/types';

const schema = z.object({
  title: z.string().min(2, 'শিরোনাম / রেফারেন্স লিখুন'),
  amount: z.coerce.number().min(0.01, 'পরিমাণ লিখুন')
});

type FormValues = z.infer<typeof schema>;

export function RootBankDepositForm({
  open,
  onClose,
  onSaved,
  deposit
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  deposit?: RootBankDeposit | null;
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
      reset({ title: deposit?.title ?? '', amount: deposit?.amount ?? 0 });
    }
  }, [open, deposit, reset]);

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
        deposited_at: new Date().toISOString(),
        ...(deposit ? {} : { created_by: user.id })
      };
      if (deposit) {
        const { error } = await supabase.from('root_bank_deposits').update(payload).eq('id', deposit.id);
        if (error) throw error;
        toast.success('জমা আপডেট হয়েছে');
      } else {
        const { error } = await supabase.from('root_bank_deposits').insert(payload);
        if (error) throw error;
        toast.success('জমা রেকর্ড হয়েছে');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'জমা সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={deposit ? 'জমা সম্পাদনা' : 'জমা যোগ করুন'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="d-title">শিরোনাম / রেফারেন্স</Label>
          <Input id="d-title" {...register('title')} placeholder="যেমন: সদস্য চাঁদা, স্পনসর…" />
          {errors.title && <p className="text-xs text-warmred-500">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="d-amount">পরিমাণ (টাকা)</Label>
          <Input id="d-amount" type="number" step="0.01" min="0" {...register('amount')} />
          {errors.amount && <p className="text-xs text-warmred-500">{errors.amount.message}</p>}
        </div>
        <p className="text-xs text-muted-foreground">তারিখ ও সময় স্বয়ংক্রিয়ভাবে রেকর্ড হবে।</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>বাতিল</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'সংরক্ষণ হচ্ছে…' : deposit ? 'পরিবর্তন সংরক্ষণ' : 'জমা যোগ করুন'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
