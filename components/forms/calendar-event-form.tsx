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
    title: z.string().min(2, 'Title is required'),
    category: z.enum(['general', 'meeting', 'event', 'emergency', 'custom']),
    custom_category: z.string().optional(),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional()
  })
  .refine((d) => !d.end_date || d.end_date >= d.start_date, {
    message: 'End must be after start',
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
      toast.error('Sign in required');
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
        toast.success('Calendar event updated');
      } else {
        const { error } = await supabase.from('calendar_events').insert(payload);
        if (error) throw error;
        toast.success('Calendar event created');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={event ? 'Edit calendar event' : 'Add calendar event'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="c-title">Title</Label>
          <Input id="c-title" {...register('title')} placeholder="Event title" />
          {errors.title && <p className="text-xs text-warmred-500">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-category">Category</Label>
          <Select id="c-category" {...register('category')}>
            <option value="general">General</option>
            <option value="meeting">Meeting</option>
            <option value="event">Event / Program</option>
            <option value="emergency">Emergency</option>
            <option value="custom">Custom</option>
          </Select>
        </div>
        {category === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="c-custom">Custom category title</Label>
            <Input id="c-custom" {...register('custom_category')} placeholder="e.g. Rehearsal" />
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-start">Starts</Label>
            <Input id="c-start" type="datetime-local" {...register('start_date')} />
            {errors.start_date && <p className="text-xs text-warmred-500">{errors.start_date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-end">Ends (optional)</Label>
            <Input id="c-end" type="datetime-local" {...register('end_date')} />
            {errors.end_date && <p className="text-xs text-warmred-500">{errors.end_date.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-desc">Description</Label>
          <Textarea id="c-desc" rows={3} {...register('description')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-loc">Location</Label>
          <Input id="c-loc" {...register('location')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          {footer}
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : event ? 'Save changes' : 'Add event'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
