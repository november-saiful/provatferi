'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useCommitteeMembers } from '@/lib/queries';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import type { Task } from '@/lib/types';

const schema = z.object({
  title: z.string().min(2, 'শিরোনাম প্রয়োজন'),
  description: z.string().optional(),
  assignee_id: z.string().optional(),
  assignee_name: z.string().min(1, 'দায়িত্বপ্রাপ্ত নাম প্রয়োজন'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  perks: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed'])
}).refine((d) => !d.end_time || !d.start_time || d.end_time >= d.start_time, {
  message: 'শেষ সময় শুরুর পরে হতে হবে',
  path: ['end_time']
});

type FormValues = z.infer<typeof schema>;

export function TaskForm({
  open,
  onClose,
  onSaved,
  defaultDate,
  task,
  footer
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  defaultDate?: Date;
  task?: Task | null;
  footer?: React.ReactNode;
}) {
  const [selectedDates, setSelectedDates] = React.useState<Date[]>(
    defaultDate ? [defaultDate] : task ? [new Date(task.task_date)] : []
  );
  const { data: members } = useCommitteeMembers();
  const [customAssignee, setCustomAssignee] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      assignee_id: '',
      assignee_name: '',
      start_time: '',
      end_time: '',
      perks: '',
      status: 'pending'
    }
  });

  const assigneeId = watch('assignee_id');

  React.useEffect(() => {
    if (open) {
      setSelectedDates(defaultDate ? [defaultDate] : task ? [new Date(task.task_date)] : []);
      setCustomAssignee(false);
      reset({
        title: task?.title ?? '',
        description: task?.description ?? '',
        assignee_id: task?.assigned_to ?? '',
        assignee_name: task?.assignee_name ?? '',
        start_time: task?.start_time?.slice(0, 5) ?? '',
        end_time: task?.end_time?.slice(0, 5) ?? '',
        perks: task?.perks ?? '',
        status: task?.status ?? 'pending'
      });
    }
  }, [open, task, defaultDate, reset]);

  // When selecting a member from dropdown, auto-fill the name
  React.useEffect(() => {
    if (assigneeId && !customAssignee) {
      const member = members?.find((m) => m.id === assigneeId);
      if (member) {
        setValue('assignee_name', member.full_name ?? '');
      }
    }
  }, [assigneeId, customAssignee, members, setValue]);

  const onSubmit = async (values: FormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('সাইন ইন প্রয়োজন');
      return;
    }

    // Use selected dates, or fall back to default date or today
    const dates = selectedDates.length > 0 ? selectedDates : defaultDate ? [defaultDate] : [new Date()];

    const payload = {
      title: values.title,
      description: values.description || null,
      assigned_to: values.assignee_id || null,
      assignee_name: values.assignee_name,
      task_date: '', // will be set per row
      start_time: values.start_time || null,
      end_time: values.end_time || null,
      perks: values.perks || null,
      status: values.status,
      created_by: user.id
    };

    try {
      if (task && dates.length === 1) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update({ ...payload, task_date: dates[0].toISOString().split('T')[0] })
          .eq('id', task.id);
        if (error) throw error;
        toast.success('টাস্ক আপডেট হয়েছে');
      } else {
        // Insert one row per selected date
        const rows = dates.map((d) => ({
          ...payload,
          task_date: d.toISOString().split('T')[0]
        }));
        const { error } = await supabase.from('tasks').insert(rows);
        if (error) throw error;
        toast.success(`${dates.length > 1 ? dates.length + 'টি টাস্ক তৈরি' : 'টাস্ক তৈরি'} হয়েছে`);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={task ? 'টাস্ক সম্পাদনা' : 'নতুন টাস্ক নির্ধারণ করুন'}
      className="sm:max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Date picker */}
        <div className="space-y-2">
          <Label>তারিখ নির্বাচন করুন</Label>
          <p className="text-xs text-muted-foreground">
            একাধিক তারিখ নির্বাচন করতে দিনগুলোতে ক্লিক করুন
          </p>
          <div className="rounded-xl border-2 border-input bg-card p-1">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => setSelectedDates(dates ?? [])}
              numberOfMonths={1}
            />
          </div>
          {selectedDates.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedDates.length}টি তারিখ নির্বাচিত
            </p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="t-title">শিরোনাম</Label>
          <Input id="t-title" {...register('title')} placeholder="টাস্কের শিরোনাম" />
          {errors.title && <p className="text-xs text-warmred-500">{errors.title.message}</p>}
        </div>

        {/* Assign to */}
        <div className="space-y-2">
          <Label>দায়িত্বপ্রাপ্ত</Label>
          {!customAssignee ? (
            <div className="space-y-2">
              <select
                className="theme-surface flex h-10 sm:h-11 w-full appearance-none rounded-xl border-2 border-input bg-card px-3 sm:px-4 py-2 pr-9 sm:pr-10 text-sm shadow-sm transition-all duration-200 hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
                value={assigneeId}
                onChange={(e) => {
                  setValue('assignee_id', e.target.value);
                  if (e.target.value) {
                    const member = members?.find((m) => m.id === e.target.value);
                    if (member) setValue('assignee_name', member.full_name ?? '');
                  }
                }}
              >
                <option value="">ব্যবহারকারী নির্বাচন করুন</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.role_id})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  setCustomAssignee(true);
                  setValue('assignee_id', '');
                  setValue('assignee_name', '');
                }}
              >
                + নাম লিখুন (তালিকায় নেই)
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                {...register('assignee_name')}
                placeholder="দায়িত্বপ্রাপ্তের নাম লিখুন"
              />
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  setCustomAssignee(false);
                  setValue('assignee_name', '');
                }}
              >
                ← তালিকা থেকে নির্বাচন করুন
              </button>
            </div>
          )}
          {errors.assignee_name && (
            <p className="text-xs text-warmred-500">{errors.assignee_name.message}</p>
          )}
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="t-start">শুরুর সময় (ঐচ্ছিক)</Label>
            <Input id="t-start" type="time" {...register('start_time')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-end">শেষ সময় (ঐচ্ছিক)</Label>
            <Input id="t-end" type="time" {...register('end_time')} />
            {errors.end_time && <p className="text-xs text-warmred-500">{errors.end_time.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="t-desc">বিবরণ (ঐচ্ছিক)</Label>
          <Textarea id="t-desc" rows={3} {...register('description')} placeholder="টাস্কের বিস্তারিত বিবরণ" />
        </div>

        {/* Perks */}
        <div className="space-y-2">
          <Label htmlFor="t-perks">পার্কস (ঐচ্ছিক)</Label>
          <Input id="t-perks" {...register('perks')} placeholder="বিশেষ সুবিধা বা পুরস্কার" />
        </div>

        {/* Status */}
        {task && (
          <div className="space-y-2">
            <Label htmlFor="t-status">স্ট্যাটাস</Label>
            <select
              id="t-status"
              className="theme-surface flex h-10 sm:h-11 w-full appearance-none rounded-xl border-2 border-input bg-card px-3 sm:px-4 py-2 pr-9 sm:pr-10 text-sm shadow-sm transition-all duration-200 hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
              {...register('status')}
            >
              <option value="pending">অপেক্ষমাণ</option>
              <option value="in_progress">চলমান</option>
              <option value="completed">সম্পন্ন</option>
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          {footer}
          <Button type="button" variant="outline" onClick={onClose}>বাতিল</Button>
          <Button type="submit" disabled={isSubmitting || selectedDates.length === 0}>
            {isSubmitting ? 'সংরক্ষণ হচ্ছে…' : task ? 'পরিবর্তন সংরক্ষণ' : 'টাস্ক নির্ধারণ করুন'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
