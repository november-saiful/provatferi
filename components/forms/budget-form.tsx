'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { BUDGET_STATUSES } from '@/lib/constants';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import type { Budget } from '@/lib/types';

const schema = z.object({
  project_name: z.string().min(2, 'Project name is required'),
  allocated_amount: z.coerce.number().min(0.01, 'Enter an amount'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function BudgetForm({
  open,
  onClose,
  onSaved,
  budget
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  budget?: Budget | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { project_name: '', allocated_amount: 0, description: '', start_date: '', end_date: '', status: 'active' }
  });

  React.useEffect(() => {
    if (open) {
      reset({
        project_name: budget?.project_name ?? '',
        allocated_amount: budget?.allocated_amount ?? 0,
        description: budget?.description ?? '',
        start_date: budget?.start_date ?? '',
        end_date: budget?.end_date ?? '',
        status: budget?.status ?? 'active'
      });
    }
  }, [open, budget, reset]);

  const onSubmit = async (values: FormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sign in required');
      return;
    }
    try {
      const payload = {
        project_name: values.project_name,
        allocated_amount: values.allocated_amount,
        description: values.description || null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        status: values.status || 'active',
        ...(budget ? {} : { created_by: user.id, spent_amount: 0 })
      };
      if (budget) {
        const { error } = await supabase.from('budgets').update(payload).eq('id', budget.id);
        if (error) throw error;
        toast.success('Budget updated');
      } else {
        const { error } = await supabase.from('budgets').insert(payload);
        if (error) throw error;
        toast.success('Budget created');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save budget');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={budget ? 'Edit budget' : 'Create budget'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="b-name">Project name</Label>
          <Input id="b-name" {...register('project_name')} placeholder="e.g. Cultural Week" />
          {errors.project_name && <p className="text-xs text-warmred-500">{errors.project_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-alloc">Allocated amount (BDT)</Label>
          <Input id="b-alloc" type="number" step="0.01" min="0" {...register('allocated_amount')} />
          {errors.allocated_amount && <p className="text-xs text-warmred-500">{errors.allocated_amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-desc">Description</Label>
          <Textarea id="b-desc" rows={3} {...register('description')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="b-start">Start date</Label>
            <Input id="b-start" type="date" {...register('start_date')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-end">End date</Label>
            <Input id="b-end" type="date" {...register('end_date')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-status">Status</Label>
          <Select id="b-status" {...register('status')}>
            {BUDGET_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : budget ? 'Save changes' : 'Create budget'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
