'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/upload';
import { useCommitteeMembers } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Select } from '@/components/ui/select';

const schema = z.object({
  title: z.string().min(2, 'শিরোনাম প্রয়োজন'),
  description: z.string().optional(),
  status: z.enum(['upcoming', 'ongoing', 'past']),
  event_date: z.string().optional(),
  location: z.string().optional(),
  organizer_id: z.string().optional(),
  courtesy: z.string().optional()
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
  event?: { id: string; title: string; description: string | null; status: 'upcoming' | 'ongoing' | 'past'; event_date: string | null; location: string | null; cover_image: string | null; organizer_id: string | null; courtesy: string | null } | null;
}) {
  const [cover, setCover] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const { user } = useAuthStore();
  const { data: members } = useCommitteeMembers();

  // Extract YYYY-MM-DDTHH:MM from an ISO date string, preserving the
  // original local-time parts (not converting through UTC).
  const toLocalDatetime = (iso: string | null): string => {
    if (!iso) return '';
    // Try direct string parse first — Supabase returns ISO strings like
    // "2022-11-04T22:00:00+06:00". We want the YYYY-MM-DDTHH:MM part.
    const match = iso.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
    return match ? match[1] : '';
  };

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event?.title ?? '',
      description: event?.description ?? '',
      status: event?.status ?? 'upcoming',
      event_date: toLocalDatetime(event?.event_date ?? null),
      location: event?.location ?? '',
      organizer_id: event?.organizer_id ?? '',
      courtesy: event?.courtesy ?? ''
    }
  });

  React.useEffect(() => {
    if (open) {
      reset({
        title: event?.title ?? '',
        description: event?.description ?? '',
        status: event?.status ?? 'upcoming',
        event_date: toLocalDatetime(event?.event_date ?? null),
        location: event?.location ?? '',
        // For a new event, pre-select the publisher as the organizer so the
        // "আয়োজনে …" attribution matches the old behavior unless changed.
        organizer_id: event?.organizer_id ?? (event ? '' : user?.id ?? ''),
        courtesy: event?.courtesy ?? ''
      });
      setCover(null);
    }
  }, [open, event, reset, user?.id]);

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
      // Treat the datetime-local value as Bangladesh time (UTC+6)
      // so the time the user entered is exactly what gets stored/displayed.
      const eventDate = values.event_date ? `${values.event_date}:00+06:00` : null;
      const payload = {
        title: values.title,
        description: values.description || null,
        status: values.status,
        event_date: eventDate,
        location: values.location || null,
        organizer_id: values.organizer_id || null,
        courtesy: values.courtesy?.trim() || null,
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
          <MarkdownEditor
            id="description"
            value={watch('description') ?? ''}
            onChange={(v) => setValue('description', v, { shouldValidate: true })}
            rows={4}
            placeholder="এই ইভেন্টটি কী নিয়ে? **বোল্ড**, *ইটালিক*, ## শিরোনাম, - তালিকা, `কোড` ও [লিংক](https://) সমর্থিত।"
            hint="সাধারণ মার্কডাউন — বোল্ড, ইটালিক, শিরোনাম, তালিকা, কোড ও লিংক ইভেন্ট পেজে রেন্ডার হয়।"
          />
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
          <Label htmlFor="organizer_id">আয়োজক (আয়োজনে)</Label>
          <Select id="organizer_id" {...register('organizer_id')}>
            <option value="">— নির্বাচন করুন (ডিফল্ট: প্রকাশক) —</option>
            {(members ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name ?? m.email}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">ইভেন্ট পেজে ‘আয়োজনে …’ হিসেবে কাকে দেখানো হবে তা বেছে নিন।</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="courtesy">সৌজন্যে</Label>
          <Input id="courtesy" {...register('courtesy')} placeholder="যার সৌজন্যে ইভেন্টটি আয়োজিত (ব্যক্তি/প্রতিষ্ঠান) — ঐচ্ছিক" />
          <p className="text-xs text-muted-foreground">ইভেন্ট পেজে ‘সৌজন্যে …’ লাইন হিসেবে দেখানো হবে। ফাঁকা রাখলে লাইনটি দেখানো হবে না।</p>
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
