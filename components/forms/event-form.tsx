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
  title: z.string().min(2, 'Title is required'),
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
      toast.error('Sign in required');
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
        toast.success('Event updated');
      } else {
        const { error } = await supabase.from('events').insert(payload);
        if (error) throw error;
        toast.success('Event created');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={event ? 'Edit event' : 'Add event'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register('title')} placeholder="Event title" />
          {errors.title && <p className="text-xs text-warmred-500">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={4} {...register('description')} placeholder="What is this event about?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...register('status')}>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="past">Past</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_date">Date &amp; time</Label>
            <Input id="event_date" type="datetime-local" {...register('event_date')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register('location')} placeholder="Venue / address" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover">Cover image</Label>
          <Input id="cover" type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
          {event?.cover_image && !cover && <p className="text-xs text-muted-foreground">Current cover kept if no new file chosen.</p>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting || uploading ? 'Saving…' : event ? 'Save changes' : 'Create event'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
