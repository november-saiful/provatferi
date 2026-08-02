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
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import type { CalendarEvent, CalendarCategory } from '@/lib/types';

const schema = z
  .object({
    title: z.string().min(2, 'শিরোনাম প্রয়োজন'),
    category: z.enum(['general', 'meeting', 'event', 'emergency', 'custom']),
    custom_category: z.string().optional(),
    start_date: z.string().min(1, 'শুরুর তারিখ প্রয়োজন'),
    end_date: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional()
  })
  .refine((d) => !d.end_date || d.end_date >= d.start_date, {
    message: 'শেষ সময় শুরুর পরে হতে হবে',
    path: ['end_date']
  });

type FormValues = z.infer<typeof schema>;

export function CalendarEventForm({
  open,
  onClose,
  onSaved,
  event,
  defaultDate,
  footer
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  footer?: React.ReactNode;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      category: 'general',
      custom_category: '',
      start_date: '',
      end_date: '',
      description: '',
      location: ''
    }
  });

  const category = watch('category');

  React.useEffect(() => {
    if (open) {
      reset({
        title: event?.title ?? '',
        category: event?.category ?? 'general',
        custom_category: event?.custom_category ?? '',
        start_date: event
          ? new Date(event.start_date).toISOString().slice(0, 16)
          : defaultDate
            ? defaultDate.toISOString().slice(0, 16)
            : '',
        end_date: event?.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
        description: event?.description ?? '',
        location: event?.location ?? ''
      });
    }
  }, [open, event, defaultDate, reset]);

  const onSubmit = async (values: FormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('সাইন ইন প্রয়োজন');
      return;
    }
    const payload = {
      title: values.title,
      category: values.category,
      custom_category: values.category === 'custom' ? values.custom_category || null : null,
      start_date: new Date(values.start_date).toISOString(),
      end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
      description: values.description || null,
      location: values.location || null,
      ...(event ? {} : { created_by: user.id })
    };
    try {
      if (event) {
        const { error } = await supabase.from('calendar_events').update(payload).eq('id', event.id);
        if (error) throw error;
        toast.success('ক্যালেন্ডার ইভেন্ট আপডেট হয়েছে');
      } else {
        const { error } = await supabase.from('calendar_events').insert(payload);
        if (error) throw error;
        toast.success('ক্যালেন্ডার ইভেন্ট তৈরি হয়েছে');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={event ? 'ক্যালেন্ডার ইভেন্ট সম্পাদনা' : 'ক্যালেন্ডার ইভেন্ট যোগ করুন'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="c-title">শিরোনাম</Label>
          <Input id="c-title" {...register('title')} placeholder="ইভেন্টের শিরোনাম" />
          {errors.title && <p className="text-xs text-warmred-500">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-category">বিভাগ</Label>
          <Select id="c-category" {...register('category')}>
            <option value="general">সাধারণ</option>
            <option value="meeting">সভা</option>
            <option value="event">অনুষ্ঠান / প্রোগ্রাম</option>
            <option value="emergency">জরুরি</option>
            <option value="custom">কাস্টম</option>
          </Select>
        </div>
        {category === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="c-custom">কাস্টম বিভাগের শিরোনাম</Label>
            <Input id="c-custom" {...register('custom_category')} placeholder="যেমন: রিহার্সাল" />
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-start">শুরু</Label>
            <Input id="c-start" type="datetime-local" {...register('start_date')} />
            {errors.start_date && <p className="text-xs text-warmred-500">{errors.start_date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-end">শেষ (ঐচ্ছিক)</Label>
            <Input id="c-end" type="datetime-local" {...register('end_date')} />
            {errors.end_date && <p className="text-xs text-warmred-500">{errors.end_date.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-desc">বিবরণ</Label>
          <Textarea id="c-desc" rows={3} {...register('description')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-loc">স্থান</Label>
          <Input id="c-loc" {...register('location')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          {footer}
          <Button type="button" variant="outline" onClick={onClose}>বাতিল</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'সংরক্ষণ হচ্ছে…' : event ? 'পরিবর্তন সংরক্ষণ' : 'ইভেন্ট যোগ করুন'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
