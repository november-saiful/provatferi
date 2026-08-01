'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import { useAddComment } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts…"
        rows={3}
      />
      <Button onClick={submit} disabled={!content.trim() || addComment.isPending}>
        {addComment.isPending ? 'Posting…' : 'Post comment'}
      </Button>
    </div>
  );
}
