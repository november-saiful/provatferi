'use client';

import * as React from 'react';
import { Eye, Search } from 'lucide-react';
import { useRecords } from '@/lib/queries';
import { formatDateTime, cn } from '@/lib/utils';
import { ACTION_LABELS } from '@/lib/constants';
import type { RecordsLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Stagger, StaggerItem } from '@/components/ui/motion';

const ACTION_VARIANT: Record<string, 'warning' | 'destructive' | 'success'> = {
  update: 'warning',
  delete: 'destructive',
  create: 'success'
};

const TABLE_LABELS: Record<string, string> = {
  expenses: 'ব্যয়',
  budgets: 'বাজেট',
  notices: 'নোটিশ',
  calendar_events: 'ক্যালেন্ডার',
  events: 'ইভেন্ট'
};

function DiffView({ original, next }: { original: Record<string, unknown> | null; next: Record<string, unknown> | null }) {
  if (!original && !next) return <p className="text-sm text-muted-foreground">কোনো তথ্য নেই।</p>;

  const keys = Array.from(new Set([...(original ? Object.keys(original) : []), ...(next ? Object.keys(next) : [])]));

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">ক্ষেত্র</th>
            <th className="px-3 py-2 font-medium">আগে</th>
            <th className="px-3 py-2 font-medium">পরে</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const before = original?.[k];
            const after = next?.[k];
            const changed = JSON.stringify(before) !== JSON.stringify(after);
            return (
              <tr key={k} className={cn('border-b border-border last:border-0', changed && 'bg-amber-50 dark:bg-amber-900/20')}>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{k}</td>
                <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs">{String(before ?? '—')}</td>
                <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs">{String(after ?? '—')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Records() {
  const { data: records, isLoading } = useRecords(true);
  const [tableFilter, setTableFilter] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [detail, setDetail] = React.useState<RecordsLog | null>(null);

  const filtered = React.useMemo(() => {
    if (!records) return [];
    return records.filter((r) => {
      if (tableFilter && r.table_name !== tableFilter) return false;
      if (actionFilter && r.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [r.modifier?.full_name, r.creator?.full_name, r.table_name, r.record_id]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, tableFilter, actionFilter, search]);

  return (
    <Stagger className="space-y-5">
      <StaggerItem className="flex flex-wrap items-center gap-3">
        <Select value={tableFilter} onChange={(e) => setTableFilter(e.target.value)} className="w-44">
          <option value="">সব টেবিল</option>
          {Object.entries(TABLE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
        <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-36">
          <option value="">সব কার্যক্রম</option>
          <option value="create">{ACTION_LABELS.create}</option>
          <option value="update">{ACTION_LABELS.update}</option>
          <option value="delete">{ACTION_LABELS.delete}</option>
        </Select>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="খুঁজুন…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </StaggerItem>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState title="কোনো অডিট এন্ট্রি নেই" description="ব্যয় ও বাজেটের পরিবর্তনগুলো এখানে রেকর্ড হবে।" />
      )}

      {filtered.length > 0 && (
        <StaggerItem>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>তারিখ / সময়</TableHead>
                <TableHead>টেবিল</TableHead>
                <TableHead>কার্যক্রম</TableHead>
                <TableHead>যিনি পরিবর্তন করেছেন</TableHead>
                <TableHead>মূল স্রষ্টা</TableHead>
                <TableHead className="text-right">পরিবর্তন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
                  <TableCell>{TABLE_LABELS[r.table_name] ?? r.table_name}</TableCell>
                  <TableCell>
                    <Badge variant={ACTION_VARIANT[r.action] ?? 'secondary'}>
                      {ACTION_LABELS[r.action] ?? r.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.modifier?.full_name ?? 'সিস্টেম'}</TableCell>
                  <TableCell>{r.creator?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setDetail(r)}>
                      <Eye /> দেখুন
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StaggerItem>
      )}

      <Dialog open={!!detail} onClose={() => setDetail(null)} title="পরিবর্তনের বিবরণ" className="max-w-2xl">
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant={ACTION_VARIANT[detail.action] ?? 'secondary'}>
                {ACTION_LABELS[detail.action] ?? detail.action}
              </Badge>
              <span className="text-muted-foreground">
                {TABLE_LABELS[detail.table_name] ?? detail.table_name} · {formatDateTime(detail.created_at)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              পরিবর্তন করেছেন <span className="font-medium text-foreground">{detail.modifier?.full_name ?? 'সিস্টেম'}</span>
              {detail.creator?.full_name ? ` · মূলত তৈরি করেছেন ${detail.creator.full_name}` : ''}
            </p>
            <DiffView original={detail.original_data} next={detail.new_data} />
          </div>
        )}
      </Dialog>
    </Stagger>
  );
}
