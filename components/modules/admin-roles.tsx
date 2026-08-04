'use client';

import * as React from 'react';
import { useRoles } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { MODULE_READ, MODULE_WRITE, ROLE_NAMES } from '@/lib/permissions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Stagger, StaggerItem } from '@/components/ui/motion';

const MODULES: { id: string; label: string }[] = [
  { id: 'evf', label: 'ইভেন্ট' },
  { id: 'glr', label: 'গ্যালারি' },
  { id: 'cln', label: 'ক্যালেন্ডার' },
  { id: 'ntb', label: 'নোটিশ' },
  { id: 'dnt', label: 'অনুদান' },
  { id: 'spn', label: 'স্পনসর' },
  { id: 'xpm', label: 'ব্যয়' },
  { id: 'bgm', label: 'বাজেট' },
  { id: 'rcd', label: 'রেকর্ড' },
  { id: 'cia', label: 'উপস্থিতি' },
  { id: 'coi', label: 'বিশ্লেষণ' },
  { id: 'admin', label: 'অ্যাডমিন' }
];

export function AdminRoles() {
  const { data: roles, isLoading } = useRoles();
  const { profile } = useAuthStore();

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const allRoles = (roles ?? [])
    .filter((r) => r.id !== 'visitor' && r.id !== 'root')
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <Stagger className="space-y-4">
      <StaggerItem className="text-sm text-muted-foreground">
        পড়ার অনুমতি 👁️ এবং লেখার অনুমতি ✏️ দিয়ে দেখানো হয়েছে। এই ভিউ তথ্যপূর্ণ — প্রয়োগ হয় Supabase Row
        Level Security নীতিতে।
      </StaggerItem>
      <StaggerItem>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">ভূমিকা</th>
              {MODULES.map((m) => (
                <th key={m.id} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground" title={m.label}>
                  {m.label.slice(0, 3).toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allRoles.map((r) => {
              const roleId = r.id as keyof typeof ROLE_NAMES;
              const isMe = profile?.role_id === roleId;
              return (
                <tr key={r.id} className={cn('border-b border-border last:border-0', isMe && 'bg-primary/5')}>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="font-medium">{ROLE_NAMES[roleId] ?? r.name}</span>
                    {isMe && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">আপনি</span>}
                  </td>
                  {MODULES.map((m) => {
                    const canRead = (MODULE_READ[m.id as keyof typeof MODULE_READ] ?? []).includes(roleId);
                    const canWrite = (MODULE_WRITE[m.id as keyof typeof MODULE_WRITE] ?? []).includes(roleId);
                    return (
                      <td key={m.id} className="px-2 py-2 text-center">
                        <span title={canWrite ? 'লেখা' : canRead ? 'পড়া' : 'অ্যাক্সেস নেই'}>
                          {canWrite ? '✏️' : canRead ? '👁️' : '—'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </StaggerItem>
    </Stagger>
  );
}
