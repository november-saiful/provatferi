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
            placeholder="Write the notice. Supports **bold**, *italic*, ## headings, - lists, `code` and [links](https://)."
          />
          {errors.content && <p className="text-xs text-warmred-500">{errors.content.message}</p>}
          <p className="text-xs text-muted-foreground">Basic markdown — bold, italic, headings, lists, code and links are rendered on the notice page.</p>
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
