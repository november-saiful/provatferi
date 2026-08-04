'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Heart, UserRound } from 'lucide-react';
import { useDonorBoard, useDonations, useRealtimeInvalidate } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canManageDonations } from '@/lib/permissions';
import { formatMoney, formatDate, relativeTime, downloadCsv, toBengaliDigits } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DonationForm } from '@/components/forms/donation-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export function Donations() {
  const qc = useQueryClient();
  const { user, role } = useAuthStore();
  const canManage = canManageDonations(role);
  const [tab, setTab] = React.useState('donate');
  const { data: board, isLoading } = useDonorBoard();
  const { data: donations, isLoading: loadingDonations } = useDonations(!!user);
  useRealtimeInvalidate('donations', [['donations']]);

  const signedIn = !!user;

  const toggleShowOnBoard = async (id: string, showOnBoard: boolean) => {
    const { error } = await supabase
      .from('donations')
      .update({ show_on_board: showOnBoard })
      .eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(showOnBoard ? 'দাতালিতে যোগ করা হয়েছে' : 'দাতালিতে থেকে সরানো হয়েছে');
      qc.invalidateQueries({ queryKey: ['donations'] });
      qc.invalidateQueries({ queryKey: ['donor-board'] });
    }
  };

  const deleteDonation = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত এই অনুদান মুছে ফেলতে চান?')) return;
    const { error } = await supabase.from('donations').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('অনুদান মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['donations'] });
      qc.invalidateQueries({ queryKey: ['donor-board'] });
    }
  };

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
    <Stagger className="space-y-6">
      <StaggerItem>
        <Tabs
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'donate', label: 'অনুদান দিন' },
            { value: 'wall', label: 'দাতাদের তালিকা' },
            ...(signedIn ? [{ value: 'records', label: 'পরিমাণ (সদস্য)' }] : []),
            ...(canManage ? [{ value: 'manage', label: 'ব্যবস্থাপনা' }] : [])
          ]}
        />
      </StaggerItem>

      {tab === 'donate' && (
        <StaggerItem>
          <Card className="mx-auto max-w-lg">
            <CardHeader>
              <CardTitle>প্রভাতফেরীকে সহায়তা করুন</CardTitle>
            </CardHeader>
            <CardContent>
              <DonationForm />
            </CardContent>
          </Card>
        </StaggerItem>
      )}

      {tab === 'wall' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-warmred-500" />
            {toBengaliDigits(board?.length ?? 0)} জন উদার সহায়তাকারী
          </div>
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          )}
          {!isLoading && (!board || board.length === 0) && (
            <EmptyState title="এখনো কোনো দাতা নেই" description="প্রভাতফেরীকে সহায়তা করা প্রথম ব্যক্তি হোন!" />
          )}
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={8} y={12}>
            {board?.map((d) => (
              <StaggerItem key={d.id}>
                <Card className="card-hover h-full">
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
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
          {stats && (
            <Stagger className="grid gap-4 sm:grid-cols-3">
              <StaggerItem>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">মোট অনুদান</p>
                    <p className="mt-1 text-2xl font-bold text-coffee-700">{formatMoney(stats.total)}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">গড় অনুদান</p>
                    <p className="mt-1 text-2xl font-bold">{formatMoney(stats.average)}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">সর্বোচ্চ অনুদান</p>
                    <p className="mt-1 text-2xl font-bold">{formatMoney(stats.highest)}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            </Stagger>
          )}
          {!loadingDonations && donations && donations.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv('donations.csv', [
                    ['Donor', 'Amount', 'Payment method', 'Transaction ID', 'Date'],
                    ...donations.map((d) => [
                      d.is_anonymous ? 'Anonymous' : d.donor_name,
                      d.amount,
                      d.payment_method ?? '',
                      d.transaction_id ?? '',
                      new Date(d.created_at).toISOString()
                    ])
                  ])
                }
              >
                <Download /> CSV এক্সপোর্ট
              </Button>
            </div>
          )}
          {loadingDonations && <Skeleton className="h-40 w-full" />}
          {!loadingDonations && donations && donations.length > 0 && (
            <StaggerItem>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>দাতা</TableHead>
                  <TableHead>পরিমাণ</TableHead>
                  <TableHead>পেমেন্ট</TableHead>
                  <TableHead>তারিখ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {d.is_anonymous ? (
                          <>
                            <UserRound className="h-4 w-4 text-muted-foreground" /> বেনামী
                          </>
                        ) : (
                          d.donor_name
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono font-medium">{formatMoney(d.amount)}</TableCell>
                    <TableCell className="text-xs">
                      {d.payment_method && d.transaction_id ? (
                        <span className="font-mono">
                          {d.payment_method === 'bkash' ? 'বিকাশ' : 'নগদ'} · {d.transaction_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{relativeTime(d.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </StaggerItem>
          )}
        </div>
      )}

      {tab === 'manage' && canManage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">অনুদান ব্যবস্থাপনা</h3>
            {donations && donations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv('donations-manage.csv', [
                    ['Donor', 'Email', 'Amount', 'Message', 'Show on Board', 'Anonymous', 'Payment', 'Date'],
                    ...donations.map((d) => [
                      d.donor_name,
                      d.donor_email ?? '',
                      d.amount,
                      d.message ?? '',
                      d.show_on_board ? 'Yes' : 'No',
                      d.is_anonymous ? 'Yes' : 'No',
                      d.payment_method ?? '',
                      new Date(d.created_at).toISOString()
                    ])
                  ])
                }
              >
                <Download /> CSV এক্সপোর্ট
              </Button>
            )}
          </div>
          {loadingDonations && <Skeleton className="h-40 w-full" />}
          {!loadingDonations && donations && donations.length === 0 && (
            <EmptyState title="এখনো কোনো অনুদান নেই" description="অনুদানগুলো এখানে দেখা যাবে।" />
          )}
          {!loadingDonations && donations && donations.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>দাতা</TableHead>
                      <TableHead>পরিমাণ</TableHead>
                      <TableHead>বার্তা</TableHead>
                      <TableHead>পেমেন্ট</TableHead>
                      <TableHead>পাবলিক দেওয়াল</TableHead>
                      <TableHead>তারিখ</TableHead>
                      <TableHead className="text-right">কার্যক্রম</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">
                              {d.is_anonymous ? (
                                <span className="flex items-center gap-1">
                                  <UserRound className="h-4 w-4 text-muted-foreground" /> বেনামী
                                </span>
                              ) : (
                                d.donor_name
                              )}
                            </span>
                            {d.donor_email && (
                              <span className="block text-xs text-muted-foreground">{d.donor_email}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-medium">{formatMoney(d.amount)}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {d.message ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {d.payment_method && d.transaction_id ? (
                            <span className="font-mono">
                              {d.payment_method === 'bkash' ? 'বিকাশ' : 'নগদ'} · {d.transaction_id}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={d.show_on_board}
                            onCheckedChange={(checked) => toggleShowOnBoard(d.id, checked)}
                            className="scale-75"
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(d.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteDonation(d.id)}
                          >
                            মুছুন
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </Stagger>
  );
}
