'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useSponsors, useRealtimeInvalidate } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canManageSponsors } from '@/lib/permissions';
import { formatDate, cn, downloadCsv } from '@/lib/utils';
import { SPONSOR_STATUSES } from '@/lib/constants';
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
      toast.success(`Status updated to ${status}`);
      qc.invalidateQueries({ queryKey: ['sponsors'] });
    }
  };

  return (
    <Stagger className="space-y-6">
      {!canManage && (
        <StaggerItem>
          <Card className="mx-auto max-w-lg">
            <CardHeader>
              <CardTitle>Become a sponsor</CardTitle>
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
            <CardTitle>Sponsorship inquiries</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!sponsors || sponsors.length === 0}
                onClick={() =>
                  downloadCsv('sponsors.csv', [
                    ['Company', 'Representative', 'Email', 'Phone', 'Proposed event', 'Status', 'Date'],
                    ...(sponsors ?? []).map((s) => [
                      s.company_name,
                      s.representative_name ?? '',
                      s.contact_email,
                      s.contact_phone ?? '',
                      s.proposed_event ?? 'General',
                      s.status,
                      new Date(s.created_at).toISOString()
                    ])
                  ])
                }
              >
                <Download /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => document.getElementById('sponsor-form-toggle')?.scrollIntoView({ behavior: 'smooth' })}>
                View public form
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-40 w-full" />}
            {!isLoading && (!sponsors || sponsors.length === 0) && (
              <EmptyState title="No inquiries yet" description="Sponsor submissions will appear here." />
            )}
            {sponsors && sponsors.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Representative</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Proposed event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sponsors.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.company_name}</TableCell>
                      <TableCell>{s.representative_name ?? '—'}</TableCell>
                      <TableCell>
                        <a href={`mailto:${s.contact_email}`} className="text-primary hover:underline">
                          {s.contact_email}
                        </a>
                      </TableCell>
                      <TableCell>{s.proposed_event ?? 'General'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[s.status] ?? 'secondary'} className="capitalize">
                          {s.status}
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
                            <option key={st} value={st} className="capitalize">
                              {st}
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
                <CardTitle>Public form preview</CardTitle>
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
