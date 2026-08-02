'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  donor_name: z.string().min(1, 'আপনার নাম লিখুন').optional(),
  donor_email: z.string().email('সঠিক ইমেইল দিন').optional().or(z.literal('')),
  amount: z.coerce.number().min(1, 'অনুদানের পরিমাণ লিখুন'),
  message: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function DonationForm() {
  const qc = useQueryClient();
  const [anonymous, setAnonymous] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { donor_name: '', donor_email: '', amount: undefined, message: '' }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase.from('donations').insert({
        donor_name: anonymous ? 'Anonymous' : values.donor_name || 'Anonymous',
        donor_email: values.donor_email || null,
        amount: values.amount,
        message: values.message || null,
        is_anonymous: anonymous,
        show_on_board: !anonymous
      });
      if (error) throw error;
      toast.success('আপনার অনুদানের জন্য ধন্যবাদ!');
      reset({ donor_name: '', donor_email: '', amount: undefined, message: '' });
      qc.invalidateQueries({ queryKey: ['donor-board'] });
      qc.invalidateQueries({ queryKey: ['donations'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'অনুদান জমা ব্যর্থ হয়েছে');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
        <Label htmlFor="d-anon">বেনামে অনুদান দিন</Label>
        <Switch id="d-anon" checked={anonymous} onCheckedChange={setAnonymous} />
      </div>
      {!anonymous && (
        <div className="space-y-2">
          <Label htmlFor="d-name">আপনার নাম</Label>
          <Input id="d-name" {...register('donor_name')} placeholder="দাতাদের তালিকার জন্য নাম" />
          {errors.donor_name && <p className="text-xs text-warmred-500">{errors.donor_name.message}</p>}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="d-email">ইমেইল (ঐচ্ছিক, রসিদের জন্য)</Label>
        <Input id="d-email" type="email" {...register('donor_email')} placeholder="you@example.com" />
        {errors.donor_email && <p className="text-xs text-warmred-500">{errors.donor_email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="d-amount">পরিমাণ (টাকা)</Label>
        <Input id="d-amount" type="number" min="1" step="1" {...register('amount')} placeholder="500" />
        {errors.amount && <p className="text-xs text-warmred-500">{errors.amount.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="d-message">বার্তা (ঐচ্ছিক)</Label>
        <Textarea id="d-message" rows={3} {...register('message')} placeholder="সমর্থনের একটি ছোট নোট…" />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'জমা হচ্ছে…' : 'অনুদান করুন'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        এটি আপনার অঙ্গীকার রেকর্ড করে। পেমেন্ট প্রক্রিয়াকরণ পরে যোগ করা হবে।
      </p>
    </form>
  );
}
