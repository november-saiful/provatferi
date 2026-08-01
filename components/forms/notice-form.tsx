'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { canPinNotices } from '@/lib/permissions';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Notice } from '@/lib/types';

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  content: z.string().min(3, 'Content is required')
});

type FormValues = z.infer<typeof schema>;

export function NoticeForm({
  open,
  onClose,
  onSaved,
  notice
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  notice?: Notice | null;
}) {
  const { role } = useAuthStore();
  const canPin = canPinNotices(role);
  const [pinned, setPinned] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '' }
  });

  React.useEffect(() => {
    if (open) {
      reset({ title: notice?.title ?? '', content: notice?.content ?? '' });
      setPinned(notice?.is_pinned ?? false);
    }
  }, [open, notice, reset]);

  const onSubmit = async (values: FormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sign in required');
      return;
    }
    try {
      if (notice) {
        const { error } = await supabase
          .from('notices')
          .update({
            title: values.title,
            content: values.content,
            is_pinned: canPin ? pinned : notice.is_pinned
          })
          .eq('id', notice.id);
        if (error) throw error;
        toast.success('Notice updated');
      } else {
        const { error } = await supabase.from('notices').insert({
          title: values.title,
          content: values.content,
          is_pinned: canPin ? pinned : false,
          created_by: user.id
        });
        if (error) throw error;
        toast.success('Notice published');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save notice');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={notice ? 'Edit notice' : 'New notice'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="n-title">Title</Label>
          <Input id="n-title" {...register('title')} placeholder="Notice title" />
          {errors.title && <p className="text-xs text-warmred-500">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="n-content">Content</Label>
          <Textarea id="n-content" rows={8} {...register('content')} placeholder="Write the notice. Plain text with line breaks." />
          {errors.content && <p className="text-xs text-warmred-500">{errors.content.message}</p>}
          <p className="text-xs text-muted-foreground">Plain text — use line breaks for paragraphs.</p>
        </div>
        {canPin && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <Label htmlFor="n-pin">Pin to top (max 3)</Label>
            <Switch id="n-pin" checked={pinned} onCheckedChange={setPinned} />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : notice ? 'Save changes' : 'Publish'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
