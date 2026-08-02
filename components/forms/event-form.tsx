'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/upload';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

const schema = z.object({
  title: z.string().min(2, 'শিরোনাম প্রয়োজন'),
  description: z.string().optional(),
  status: z.enum(['upcoming', 'ongoing', 'past']),
  event_date: z.string().optional(),
  location: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function EventForm({
  open,
  onClose,
  onSaved,
  event
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  event?: { id: string; title: string; description: string | null; status: 'upcoming' | 'ongoing' | 'past'; event_date: string | null; location: string | null; cover_image: string | null } | null;
}) {
  const [cover, setCover] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event?.title ?? '',
      description: event?.description ?? '',
      status: event?.status ?? 'upcoming',
      event_date: event?.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
      location: event?.location ?? ''
    }
  });

  React.useEffect(() => {
    if (open) {
      reset({
        title: event?.title ?? '',
        description: event?.description ?? '',
        status: event?.status ?? 'upcoming',
        event_date: event?.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
        location: event?.location ?? ''
      });
      setCover(null);
    }
  }, [open, event, reset]);

  const onSubmit = async (values: FormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('সাইন ইন প্রয়োজন');
      return;
    }
    setUploading(true);
    try {
      let coverImage: string | null = event?.cover_image ?? null;
      if (cover) {
        coverImage = await uploadImage(cover, 'events');
      }
      const payload = {
        title: values.title,
        description: values.description || null,
        status: values.status,
        event_date: values.event_date ? new Date(values.event_date).toISOString() : null,
        location: values.location || null,
        ...(event ? {} : { created_by: user.id }),
        cover_image: coverImage
      };
      if (event) {
        const { error } = await supabase.from('events').update(payload).eq('id', event.id);
        if (error) throw error;
        toast.success('ইভেন্ট আপডেট হয়েছে');
      } else {
        const { error } = await supabase.from('events').insert(payload);
        if (error) throw error;
        toast.success('ইভেন্ট তৈরি হয়েছে');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ইভেন্ট সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={event ? 'ইভেন্ট সম্পাদনা' : 'ইভেন্ট যোগ করুন'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">শিরোনাম</Label>
          <Input id="title" {...register('title')} placeholder="ইভেন্টের শিরোনাম" />
          {errors.title && <p className="text-xs text-warmred-500">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">বিবরণ</Label>
          <Textarea id="description" rows={4} {...register('description')} placeholder="এই ইভেন্টটি কী নিয়ে?" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">অবস্থা</Label>
            <Select id="status" {...register('status')}>
              <option value="upcoming">আসন্ন</option>
              <option value="ongoing">চলমান</option>
              <option value="past">সমাপ্ত</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_date">তারিখ ও সময়</Label>
            <Input id="event_date" type="datetime-local" {...register('event_date')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">স্থান</Label>
          <Input id="location" {...register('location')} placeholder="অবস্থান / ঠিকানা" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover">কভার ছবি</Label>
          <Input id="cover" type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
          {event?.cover_image && !cover && <p className="text-xs text-muted-foreground">নতুন ফাইল না বেছে নিলে বর্তমান কভার রাখা হবে।</p>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>বাতিল</Button>
          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting || uploading ? 'সংরক্ষণ হচ্ছে…' : event ? 'পরিবর্তন সংরক্ষণ' : 'ইভেন্ট তৈরি করুন'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
