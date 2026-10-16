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
import { Switch } from '@/components/ui/switch';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import type { Notice } from '@/lib/types';

const schema = z.object({
  title: z.string().min(2, 'শিরোনাম প্রয়োজন'),
  content: z.string().min(3, 'বিষয়বস্তু প্রয়োজন')
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
    setValue,
    watch,
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
      toast.error('সাইন ইন প্রয়োজন');
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
        toast.success('নোটিশ আপডেট হয়েছে');
      } else {
        const { error } = await supabase.from('notices').insert({
          title: values.title,
          content: values.content,
          is_pinned: canPin ? pinned : false,
          created_by: user.id
        });
        if (error) throw error;
        toast.success('নোটিশ প্রকাশিত হয়েছে');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'নোটিশ সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={notice ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="n-title">শিরোনাম</Label>
          <Input id="n-title" {...register('title')} placeholder="নোটিশের শিরোনাম" />
          {errors.title && <p className="text-xs text-warmred-500">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="n-content">বিষয়বস্তু</Label>
          <MarkdownEditor
            id="n-content"
            value={watch('content') ?? ''}
            onChange={(v) => setValue('content', v, { shouldValidate: true })}
            rows={8}
            placeholder="নোটিশটি লিখুন। **বোল্ড**, *ইটালিক*, ## শিরোনাম, - তালিকা, `কোড` এবং [লিংক](https://) সমর্থিত।"
            hint="সাধারণ মার্কডাউন — বোল্ড, ইটালিক, শিরোনাম, তালিকা, কোড ও লিংক নোটিশ পেজে রেন্ডার হয়।"
          />
          {errors.content && <p className="text-xs text-warmred-500">{errors.content.message}</p>}
        </div>
        {canPin && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <Label htmlFor="n-pin">উপরে পিন করুন (সর্বোচ্চ ৩টি)</Label>
            <Switch id="n-pin" checked={pinned} onCheckedChange={setPinned} />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>বাতিল</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'সংরক্ষণ হচ্ছে…' : notice ? 'পরিবর্তন সংরক্ষণ' : 'প্রকাশ করুন'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
