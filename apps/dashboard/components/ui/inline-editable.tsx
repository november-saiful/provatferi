'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface InlineEditableTextProps {
  /** The app_config key to read/write (e.g. 'bkash_number'). */
  configKey: string;
  /** Fallback value when DB has no value yet. */
  fallback?: string;
  /** Whether the current user can edit. */
  canEdit?: boolean;
  /** Extra class names on the outer wrapper. */
  className?: string;
  /** Class names on the display text. */
  displayClassName?: string;
  /** Input type (default: text). */
  inputType?: string;
  /** Placeholder shown in the input when empty. */
  placeholder?: string;
}

/**
 * Displays a text value from app_config with an inline-edit affordance.
 * Admin/root/president see a pencil icon on hover; clicking it opens an input
 * that saves directly to the `app_config` Supabase table.
 */
export function InlineEditableText({
  configKey,
  fallback = '',
  canEdit = false,
  className,
  displayClassName,
  inputType = 'text',
  placeholder = ''
}: InlineEditableTextProps) {
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Current display value (from query cache or fallback)
  const cached = qc.getQueryData<string>(['app-config', configKey]);
  const displayValue = cached || fallback;

  React.useEffect(() => {
    if (editing) {
      setDraft(displayValue);
      // Small delay so the input mounts before we focus it
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editing, displayValue]);

  const save = async () => {
    if (!draft.trim()) {
      toast.error('মান খালি রাখা যাবে না');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_config')
        .upsert({ key: configKey, value: draft.trim() }, { onConflict: 'key' });
      if (error) throw error;
      qc.setQueryData(['app-config', configKey], draft.trim());
      toast.success('সফলভাবে সেভ হয়েছে');
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'সেভ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setEditing(false);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save();
    else if (e.key === 'Escape') cancel();
  };

  if (!canEdit) {
    return <span className={displayClassName}>{displayValue}</span>;
  }

  if (editing) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <input
          ref={inputRef}
          type={inputType}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-8 min-w-[10ch] rounded-lg border-2 border-primary/50 bg-card px-2 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage-600 text-white transition-colors hover:bg-sage-700 disabled:opacity-50"
          aria-label="সেভ করুন"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          aria-label="বাতিল করুন"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span className={cn('group/inline relative inline-flex items-center gap-1.5', className)}>
      <span className={displayClassName}>{displayValue}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition-all hover:bg-muted hover:text-primary group-hover/inline:opacity-100"
        aria-label="নম্বর এডিট করুন"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </span>
  );
}
