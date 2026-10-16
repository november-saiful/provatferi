'use client';

import * as React from 'react';
import { BadgeCheck, Clock3, Inbox, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { useAlumniClaims } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { toast } from 'sonner';
import type { AlumniClaim } from '@/lib/types';

type Filter = 'pending' | 'approved' | 'rejected';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function AlumniClaims() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = React.useState<Filter>('pending');
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const { data: claims, isLoading } = useAlumniClaims(true, filter);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['alumni-claims'] });
    qc.invalidateQueries({ queryKey: ['profiles'] });
    qc.invalidateQueries({ queryKey: ['alumni'] });
    qc.invalidateQueries({ queryKey: ['committee-members'] });
  };

  const setStatus = async (claim: AlumniClaim, status: 'approved' | 'rejected') => {
    setBusyId(claim.id);
    try {
      if (status === 'approved') {
        // Promote the profile to alumni, carrying over the verified details.
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role_id: 'alm',
            full_name: claim.full_name,
            academic_session: claim.academic_session,
            department: claim.department,
            hall_name: claim.hall_name,
            reg_id: claim.reg_id,
            phone: claim.phone,
          })
          .eq('id', claim.user_id);
        if (profileError) throw profileError;
      }
      const { error: claimError } = await supabase
        .from('alumni_claims')
        .update({
          status,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', claim.id);
      if (claimError) throw claimError;
      toast.success(status === 'approved' ? 'অ্যালামনাই হিসেবে অনুমোদিত' : 'দাবি প্রত্যাখ্যাত');
      refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'pending', label: 'অপেক্ষমাণ', icon: Clock3 },
            { id: 'approved', label: 'অনুমোদিত', icon: BadgeCheck },
            { id: 'rejected', label: 'প্রত্যাখ্যাত', icon: XCircle },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
              filter === f.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <f.icon className="h-4 w-4" aria-hidden="true" />
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && (claims?.length ?? 0) === 0 && (
        <EmptyState
          title="কোনো দাবি নেই"
          description="নতুন দাবি এলে এখানে দেখা যাবে।"
          icon={<Inbox className="h-7 w-7" />}
        />
      )}

      {!isLoading && (claims?.length ?? 0) > 0 && (
        <Stagger className="grid gap-4 lg:grid-cols-2">
          {claims!.map((claim) => (
            <StaggerItem key={claim.id}>
              <Card className="h-full">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold tracking-tight">{claim.full_name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[claim.department, claim.academic_session].filter(Boolean).join(' • ') || 'বিভাগ উল্লেখ নেই'}
                        {' • '}
                        {fmtDate(claim.created_at)}
                      </p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {[
                      ['হল', claim.hall_name],
                      ['রেজি নম্বর', claim.reg_id],
                      ['ফোন', claim.phone],
                    ].map(([k, v]) => (
                      <div key={k} className="min-w-0">
                        <dt className="font-semibold text-muted-foreground">{k}</dt>
                        <dd className="truncate">{v || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                  {claim.note && (
                    <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed">{claim.note}</p>
                  )}
                  {claim.status === 'pending' ? (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        disabled={busyId === claim.id}
                        onClick={() => setStatus(claim, 'approved')}
                      >
                        <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                        অনুমোদন
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === claim.id}
                        onClick={() => setStatus(claim, 'rejected')}
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        প্রত্যাখ্যান
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {claim.status === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}
                      {claim.reviewed_at ? ` • ${fmtDate(claim.reviewed_at)}` : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
