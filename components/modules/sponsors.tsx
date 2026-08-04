'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useSponsors, useRealtimeInvalidate } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canManageSponsors } from '@/lib/permissions';
import { formatDate, cn, downloadCsv } from '@/lib/utils';
import { SPONSOR_STATUSES, SPONSOR_STATUS_LABELS } from '@/lib/constants';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SponsorForm } from '@/components/forms/sponsor-form';
import { Badge } from '@/components/ui/badge';
import { Stagger, StaggerItem } from '@/components/ui/motion';

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive'
};

export function Sponsors() {
  const qc = useQueryClient();
  const { role } = useAuthStore();
  const canManage = canManageSponsors(role);
  const { data: sponsors, isLoading } = useSponsors(canManage);
  useRealtimeInvalidate('sponsors', [['sponsors']]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('sponsors').update({ status }).eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`অবস্থা আপডেট হয়েছে: ${SPONSOR_STATUS_LABELS[status] ?? status}`);
      qc.invalidateQueries({ queryKey: ['sponsors'] });
    }
  };

  return (
    <Stagger className="space-y-6">
      {!canManage && (
        <StaggerItem>
          <Card className="mx-auto max-w-lg">
            <CardHeader>
              <CardTitle>স্পনসর হোন</CardTitle>
            </CardHeader>
            <CardContent>
              <SponsorForm />
            </CardContent>
          </Card>
        </StaggerItem>
      )}

      {canManage && (
        <StaggerItem>
          <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>স্পনসরশিপ আবেদন</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!sponsors || sponsors.length === 0}
                onClick={() =>
                  downloadCsv('sponsors.csv', [
                    ['Company', 'Representative', 'Email', 'Phone', 'Payment method', 'Transaction ID', 'Proposed event', 'Status', 'Date'],
                    ...(sponsors ?? []).map((s) => [
                      s.company_name,
                      s.representative_name ?? '',
                      s.contact_email ?? '',
                      s.contact_phone ?? '',
                      s.payment_method ?? '',
                      s.transaction_id ?? '',
                      s.proposed_event ?? 'General',
                      s.status,
                      new Date(s.created_at).toISOString()
                    ])
                  ])
                }
              >
                <Download /> CSV এক্সপোর্ট
              </Button>
              <Button variant="outline" size="sm" onClick={() => document.getElementById('sponsor-form-toggle')?.scrollIntoView({ behavior: 'smooth' })}>
                পাবলিক ফর্ম দেখুন
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-40 w-full" />}
            {!isLoading && (!sponsors || sponsors.length === 0) && (
              <EmptyState title="এখনো কোনো আবেদন নেই" description="স্পনসর জমাগুলো এখানে দেখা যাবে।" />
            )}
            {sponsors && sponsors.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>প্রতিষ্ঠান</TableHead>
                    <TableHead>প্রতিনিধি</TableHead>
                    <TableHead>যোগাযোগ</TableHead>
                    <TableHead>পেমেন্ট</TableHead>
                    <TableHead>প্রস্তাবিত ইভেন্ট</TableHead>
                    <TableHead>অবস্থা</TableHead>
                    <TableHead>তারিখ</TableHead>
                    <TableHead className="text-right">কার্যক্রম</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sponsors.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.company_name}</TableCell>
                      <TableCell>{s.representative_name ?? '—'}</TableCell>
                      <TableCell>
                        {s.contact_email ? (
                          <a href={`mailto:${s.contact_email}`} className="text-primary hover:underline">
                            {s.contact_email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {s.contact_phone && (
                          <span className="block text-xs text-muted-foreground">{s.contact_phone}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.payment_method && s.transaction_id ? (
                          <span className="font-mono">
                            {s.payment_method === 'bkash' ? 'বিকাশ' : 'নগদ'} · {s.transaction_id}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{s.proposed_event ?? 'সাধারণ'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[s.status] ?? 'secondary'}>
                          {SPONSOR_STATUS_LABELS[s.status] ?? s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={s.status}
                          onChange={(e) => updateStatus(s.id, e.target.value)}
                          className="h-8 w-32 text-xs"
                        >
                          {SPONSOR_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {SPONSOR_STATUS_LABELS[st] ?? st}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </StaggerItem>
      )}

      {canManage && (
        <StaggerItem>
          <div id="sponsor-form-toggle">
            <Card className="mx-auto max-w-lg">
              <CardHeader>
                <CardTitle>পাবলিক ফর্ম প্রিভিউ</CardTitle>
              </CardHeader>
              <CardContent>
                <SponsorForm />
              </CardContent>
            </Card>
          </div>
        </StaggerItem>
      )}
    </Stagger>
  );
}
