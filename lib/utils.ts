import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Convert Latin digits (0-9) to Bengali numerals (০-৯), preserving all other
// characters. Safe to call on any user-facing number string.
export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('bn', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('bn', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(value?: string | null): string {
  if (!value) return '—';
  const [h, m = '00'] = value.split(':');
  const hour = parseInt(h, 10);
  const minute = parseInt(m, 10);
  // Render through the Bengali locale so hour AND minute use Bengali numerals
  // (Intl 'bn' outputs ২:৩০ PM, matching the rest of the site).
  return new Intl.DateTimeFormat('bn', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(2000, 0, 1, hour, minute));
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('bn', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0
  }).format(amount);
}

export function relativeTime(value?: string | null): string {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'এইমাত্র';
  if (mins < 60) return `${toBengaliDigits(mins)} মিনিট আগে`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${toBengaliDigits(hours)} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${toBengaliDigits(days)} দিন আগে`;
  return formatDate(value);
}

export function truncate(str: string, len = 120): string {
  if (str.length <= len) return str;
  return str.slice(0, len).trimEnd() + '…';
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Minimal, safe markdown renderer for notice content (bold, italic, code,
// links, lists, headings, paragraphs). Escapes HTML first — never injects raw input.
export function renderMarkdown(src: string): string {
  const esc = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const inline = (s: string) =>
    s
      .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-sm">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer" class="text-primary underline">$1</a>'
      );

  const lines = esc.split(/\r?\n/);
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const ordered = line.match(/^\d+\.\s+(.*)$/);

    if (heading) {
      closeList();
      const lvl = Math.min(heading[1].length, 3);
      out.push(`<h${lvl} class="mt-4 font-semibold">${inline(heading[2])}</h${lvl}>`);
    } else if (bullet || ordered) {
      const tag = bullet ? 'ul' : 'ol';
      if (list !== tag) {
        closeList();
        list = tag;
        out.push(`<${tag} class="my-2 space-y-1 pl-5 ${tag === 'ol' ? 'list-decimal' : 'list-disc'}">`);
      }
      out.push(`<li>${inline((bullet ?? ordered)![1])}</li>`);
    } else if (line.trim() === '') {
      closeList();
      out.push('');
    } else {
      closeList();
      out.push(`<p class="my-2">${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}
