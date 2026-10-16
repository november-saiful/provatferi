'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import { useAddComment } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { cn } from '@/lib/utils';

interface CommentBoxProps {
  eventId: string;
  className?: string;
}

export function CommentBox({ eventId, className }: CommentBoxProps) {
  const { user } = useAuthStore();
  const addComment = useAddComment();
  const [content, setContent] = React.useState('');

  if (!user) return null;

  const submit = async () => {
    if (!content.trim()) return;
    await addComment.mutateAsync({ eventId, content: content.trim() }, {
      onError: (err) => toast.error(err.message)
    });
    setContent('');
  };

  return (
    <div className={cn('space-y-2', className)}>
      <MarkdownEditor
        id="event-comment"
        value={content}
        onChange={setContent}
        rows={3}
        placeholder="আপনার মতামত শেয়ার করুন…"
        hint="সাধারণ মার্কডাউন সমর্থিত — **বোল্ড**, *ইটালিক*, `কোড`, [লিংক](https://) ও - তালিকা।"
      />
      <Button onClick={submit} disabled={!content.trim() || addComment.isPending}>
        {addComment.isPending ? 'পোস্ট হচ্ছে…' : 'মন্তব্য পোস্ট করুন'}
      </Button>
    </div>
  );
}
