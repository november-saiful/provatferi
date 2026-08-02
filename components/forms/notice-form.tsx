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
import { Bold, Italic, List, Link2, Heading2, Code } from 'lucide-react';
import type { Notice } from '@/lib/types';

const TOOLBAR_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40';

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
    getValues,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '' }
  });

  const contentRef = React.useRef<HTMLTextAreaElement | null>(null);

  const wrapSelection = (before: string, after = before, placeholder = 'text') => {
    const el = contentRef.current;
    const value = getValues('content') ?? '';
    if (!el) {
      setValue('content', value ? `${before}${placeholder}${after}` : before + placeholder + after, { shouldValidate: true });
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || placeholder;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    setValue('content', next, { shouldValidate: true });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const prependLine = (prefix: string) => {
    const el = contentRef.current;
    const value = getValues('content') ?? '';
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
    setValue('content', next, { shouldValidate: true });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
    });
  };

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
          <div className="flex flex-wrap items-center gap-1">
            <button type="button" className={TOOLBAR_BTN} onClick={() => wrapSelection('**')} title="Bold" aria-label="Bold">
              <Bold className="h-4 w-4" />
            </button>
            <button type="button" className={TOOLBAR_BTN} onClick={() => wrapSelection('*')} title="Italic" aria-label="Italic">
              <Italic className="h-4 w-4" />
            </button>
            <button type="button" className={TOOLBAR_BTN} onClick={() => wrapSelection('## ', '', 'Heading')} title="Heading" aria-label="Heading">
              <Heading2 className="h-4 w-4" />
            </button>
            <button type="button" className={TOOLBAR_BTN} onClick={() => wrapSelection('`', '`', 'code')} title="Code" aria-label="Code">
              <Code className="h-4 w-4" />
            </button>
            <button type="button" className={TOOLBAR_BTN} onClick={() => wrapSelection('[', '](https://)', 'link text')} title="Link" aria-label="Link">
              <Link2 className="h-4 w-4" />
            </button>
            <button type="button" className={TOOLBAR_BTN} onClick={() => prependLine('- ')} title="Bullet list" aria-label="Bullet list">
              <List className="h-4 w-4" />
            </button>
          </div>
          <Textarea
            id="n-content"
            rows={8}
            {...register('content')}
            ref={(e) => {
              register('content').ref(e);
              contentRef.current = e;
            }}
            placeholder="নোটিশটি লিখুন। **বোল্ড**, *ইটালিক*, ## শিরোনাম, - তালিকা, `কোড` এবং [লিংক](https://) সমর্থিত।"
          />
          {errors.content && <p className="text-xs text-warmred-500">{errors.content.message}</p>}
          <p className="text-xs text-muted-foreground">সাধারণ মার্কডাউন — বোল্ড, ইটালিক, শিরোনাম, তালিকা, কোড ও লিংক নোটিশ পেজে রেন্ডার হয়।</p>
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
