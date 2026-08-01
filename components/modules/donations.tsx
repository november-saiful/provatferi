'use client';

import * as React from 'react';
import { Heart, UserRound } from 'lucide-react';
import { useDonorBoard, useDonations } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { formatMoney, formatDate, relativeTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs } from '@/components/ui/tabs';
import { DonationForm } from '@/components/forms/donation-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function Donations() {
  const { user } = useAuthStore();
  const [tab, setTab] = React.useState('donate');
  const { data: board, isLoading } = useDonorBoard();
  const { data: donations, isLoading: loadingDonations } = useDonations(!!user);

  const signedIn = !!user;
  const stats = React.useMemo(() => {
    if (!donations || donations.length === 0) return null;
    const total = donations.reduce((s, d) => s + d.amount, 0);
    const amounts = donations.map((d) => d.amount);
    return {
      total,
      average: total / donations.length,
      highest: Math.max(...amounts),
      count: donations.length
    };
  }, [donations]);

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          { value: 'donate', label: 'Donate' },
          { value: 'wall', label: 'Donor Wall' },
          ...(signedIn ? [{ value: 'records', label: 'Amounts (members)' }] : [])
        ]}
      />

      {tab === 'donate' && (
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Support Provatferi</CardTitle>
          </CardHeader>
          <CardContent>
            <DonationForm />
          </CardContent>
        </Card>
      )}

      {tab === 'wall' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-warmred-500" />
            {board?.length ?? 0} generous supporters
          </div>
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          )}
          {!isLoading && (!board || board.length === 0) && (
            <EmptyState title="No donors yet" description="Be the first to support Provatferi!" />
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {board?.map((d) => (
              <Card key={d.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coffee-100 text-coffee-600 dark:bg-coffee-900 dark:text-coffee-300">
                      <Heart className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium">{d.donor_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(d.created_at)}</p>
                    </div>
                  </div>
                  {d.message && <p className="mt-3 text-sm text-muted-foreground">“{d.message}”</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
          {stats && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total donated</p>
                  <p className="mt-1 text-2xl font-bold text-coffee-700">{formatMoney(stats.total)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Average donation</p>
                  <p className="mt-1 text-2xl font-bold">{formatMoney(stats.average)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Highest donation</p>
                  <p className="mt-1 text-2xl font-bold">{formatMoney(stats.highest)}</p>
                </CardContent>
              </Card>
            </div>
          )}
          {loadingDonations && <Skeleton className="h-40 w-full" />}
          {!loadingDonations && donations && donations.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {d.is_anonymous ? (
                          <>
                            <UserRound className="h-4 w-4 text-muted-foreground" /> Anonymous
                          </>
                        ) : (
                          d.donor_name
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono font-medium">{formatMoney(d.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{relativeTime(d.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
