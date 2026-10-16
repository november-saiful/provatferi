'use client';

import * as React from 'react';
import { Bold, Code, Heading2, Italic, Link2, List } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const TOOLBAR_BTN =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40';

interface MarkdownEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
  className?: string;
}

/**
 * Markdown textarea with a formatting toolbar (bold, italic, heading, code,
 * link, bullet list). Controlled: pass `value` + `onChange`. The toolbar wraps
 * the current selection with markdown syntax and keeps focus/selection after.
 * Rendered content is handled by the caller (see `renderMarkdown` in utils).
 */
export function MarkdownEditor({
  id,
  value,
  onChange,
  rows = 8,
  placeholder,
  hint,
  className
}: MarkdownEditorProps) {
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  const wrapSelection = (before: string, after = before, selectionPlaceholder = 'text') => {
    const el = ref.current;
    const current = value ?? '';
    if (!el) {
      onChange(before + selectionPlaceholder + after);
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const selected = current.slice(start, end) || selectionPlaceholder;
    const next = `${current.slice(0, start)}${before}${selected}${after}${current.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const prependLine = (prefix: string) => {
    const el = ref.current;
    const current = value ?? '';
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const lineStart = current.lastIndexOf('\n', start - 1) + 1;
    const next = `${current.slice(0, lineStart)}${prefix}${current.slice(lineStart)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
    });
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex max-w-full flex-wrap items-center gap-1 overflow-x-auto pb-0.5">
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
        id={id}
        rows={rows}
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
