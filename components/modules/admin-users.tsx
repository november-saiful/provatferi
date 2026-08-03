'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useProfiles, useRoles } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { ROLE_NAMES } from '@/lib/permissions';
import { invokeUserAdmin } from '@/lib/service';
import { formatDate, cn, toBengaliDigits } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { UserCog, ChevronDown, Landmark, Ban, UserCheck, Trash2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stagger, StaggerItem, EASE } from '@/components/ui/motion';
import type { Profile } from '@/lib/types';

const SORT_OPTIONS: { value: 'newest' | 'oldest'; label: string }[] = [
  { value: 'newest', label: 'নতুন প্রথমে' },
  { value: 'oldest', label: 'পুরোনো প্রথমে' }
];

export function AdminUsers() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { data: profiles, isLoading } = useProfiles(true);
  const { data: roles } = useRoles();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>('newest');
  const [banTarget, setBanTarget] = React.useState<Profile | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<Profile | null>(null);
  const [busy, setBusy] = React.useState(false);
  const myProfile = profiles?.find((p) => p.id === user?.id);

  const roleOptions = React.useMemo(
    () => [{ value: 'all', label: 'সব ভূমিকা' }, ...(roles ?? []).map((r) => ({ value: r.id, label: r.name }))],
    [roles]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return (profiles ?? [])
      .filter((p) => {
        if (roleFilter !== 'all' && p.role_id !== roleFilter) return false;
        if (q) {
          const haystack = [p.full_name, p.email, p.phone, p.reg_id, p.department, p.hall_name]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ta = new Date(a.created_at ?? '').getTime();
        const tb = new Date(b.created_at ?? '').getTime();
        return sortOrder === 'newest' ? tb - ta : ta - tb;
      });
  }, [profiles, query, roleFilter, sortOrder]);

  const changeRole = async (userId: string, roleId: string) => {
    if (userId === user?.id) {
      toast.error('আপনি নিজের ভূমিকা পরিবর্তন করতে পারবেন না');
      return;
    }
    if (roleId === 'admin' && myProfile?.role_id !== 'pr') {
      toast.error('শুধুমাত্র সভাপতি অ্যাডমিন নিয়োগ দিতে পারবেন');
      return;
    }
    if (roleId === 'admin') {
      const existingAdmin = profiles?.find((p) => p.role_id === 'admin' && p.id !== userId);
      if (existingAdmin) {
        toast.error('একজন মাত্র অ্যাডমিন থাকতে পারবে। প্রথমে বিদ্যমান অ্যাডমিনের ভূমিকা পরিবর্তন করুন।');
        return;
      }
    }
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ role_id: roleId })
      .eq('id', userId)
      .select('*')
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (updated) {
      qc.setQueryData<Profile[]>(['profiles'], (old) =>
        (old ?? []).map((p) => (p.id === userId ? (updated as Profile) : p))
      );
    }
    toast.success('ভূমিকা আপডেট হয়েছে');
    qc.invalidateQueries({ queryKey: ['profiles'] });
  };

  const confirmBan = async () => {
    if (!banTarget) return;
    setBusy(true);
    try {
      await invokeUserAdmin(banTarget.is_active ? 'ban' : 'unban', banTarget.id);
      toast.success(banTarget.is_active ? 'অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে' : 'অ্যাকাউন্ট পুনরায় সক্রিয় হয়েছে');
      setBanTarget(null);
      qc.invalidateQueries({ queryKey: ['profiles'] });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setBusy(true);
    try {
      await invokeUserAdmin('delete', removeTarget.id);
      toast.success('ব্যবহারকারী মুছে ফেলা হয়েছে');
      setRemoveTarget(null);
      qc.invalidateQueries({ queryKey: ['profiles'] });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Stagger className="space-y-4">
      <StaggerItem className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <UserCog className="h-4 w-4" />
        {toBengaliDigits(filtered.length)}টি প্রোফাইল
      </StaggerItem>

      {/* Filter bar */}
      <StaggerItem className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম, ইমেইল, মোবাইল বা রেজিস্ট্রেশন আইডি দিয়ে খুঁজুন…"
            className="pl-10"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-11 w-full sm:w-48"
          options={roleOptions}
          aria-label="ভূমিকা ফিল্টার"
        />
        <Select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
          className="h-11 w-full sm:w-44"
          options={SORT_OPTIONS}
          aria-label="সাইন-আপ তারিখ ক্রম"
        />
      </StaggerItem>

      {filtered.length === 0 ? (
        <EmptyState
          title={query || roleFilter !== 'all' ? 'কোনো প্রোফাইল পাওয়া যায়নি' : 'এখনো কোনো ব্যবহারকারী নেই'}
          description="ফিল্টার পরিবর্তন করে দেখুন, অথবা সাইন আপ করার পর ব্যবহারকারীরা এখানে দেখা যাবে।"
        />
      ) : (
        <StaggerItem>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" aria-label="ঢাকা বিশ্ববিদ্যালয়ের তথ্য" />
                <TableHead>ব্যবহারকারী</TableHead>
                <TableHead>ইমেইল</TableHead>
                <TableHead>ভূমিকা</TableHead>
                <TableHead>সক্রিয়</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const isOpen = expandedId === p.id;
                const duFields = [
                  { label: 'শিক্ষাবর্ষ', value: p.academic_session },
                  { label: 'বিভাগ', value: p.department },
                  { label: 'হলের নাম', value: p.hall_name },
                  { label: 'রেজিস্ট্রেশন আইডি', value: p.reg_id },
                  { label: 'মোবাইল', value: p.phone },
                  { label: 'যোগদান', value: p.created_at ? formatDate(p.created_at) : '' }
                ];
                const hasAny = duFields.some((f) => !!f.value);
                return (
                  <React.Fragment key={p.id}>
                    <TableRow className={cn(isOpen && 'bg-muted/40')}>
                      <TableCell className="w-10">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isOpen ? null : p.id)}
                          aria-expanded={isOpen}
                          aria-controls={`du-${p.id}`}
                          aria-label={isOpen ? 'শিক্ষার্থীর তথ্য লুকান' : 'শিক্ষার্থীর তথ্য দেখুন'}
                          title={isOpen ? 'শিক্ষার্থীর তথ্য লুকান' : 'শিক্ষার্থীর তথ্য দেখুন'}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
                        >
                          <motion.span
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2, ease: EASE }}
                            className="flex"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </motion.span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <Avatar name={p.full_name} src={p.avatar_url} className="h-8 w-8 text-xs" />
                          <span className="font-medium">{p.full_name ?? '—'}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.email}</TableCell>
                      <TableCell>
                        <Badge variant="coffee">{ROLE_NAMES[p.role_id] ?? p.role_id}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_active ? 'success' : 'destructive'}>
                          {p.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={p.role_id}
                            onChange={(e) => changeRole(p.id, e.target.value)}
                            className="h-8 w-40 text-xs"
                            disabled={p.id === user?.id}
                          >
                            {roles?.map((r) => (
                              <option
                                key={r.id}
                                value={r.id}
                                disabled={
                                  r.id === 'admin' && myProfile?.role_id !== 'pr' && p.role_id !== 'admin'
                                }
                              >
                                {r.name}
                                {r.id === 'admin' && myProfile?.role_id !== 'pr' ? ' (শুধু সভাপতি)' : ''}
                              </option>
                            ))}
                          </Select>
                          <Button
                            variant={p.is_active ? 'destructive' : 'outline'}
                            size="sm"
                            disabled={p.id === user?.id}
                            onClick={() => setBanTarget(p)}
                            title={p.is_active ? 'অ্যাকাউন্ট নিষ্ক্রিয় করুন' : 'অ্যাকাউন্ট সক্রিয় করুন'}
                          >
                            {p.is_active ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            <span className="hidden lg:inline">{p.is_active ? 'ব্যান' : 'সক্রিয়'}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-warmred-500 hover:bg-warmred-50 hover:text-warmred-600 dark:hover:bg-warmred-900/30"
                            disabled={p.id === user?.id}
                            onClick={() => setRemoveTarget(p)}
                            title="ব্যবহারকারী মুছে ফেলুন"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden lg:inline">মুছুন</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <tr key={`${p.id}-du`} id={`du-${p.id}`}>
                          <TableCell colSpan={6} className="bg-muted/25 p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: EASE }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border px-4 py-4">
                                <div className="mb-3 flex items-center gap-2 text-coffee-800 dark:text-coffee-200">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-coffee-600/10 text-coffee-700 dark:bg-coffee-800/50 dark:text-coffee-300">
                                    <Landmark className="h-4 w-4" />
                                  </span>
                                  <span className="text-sm font-semibold">ঢাকা বিশ্ববিদ্যালয়ের শিক্ষার্থীর তথ্য</span>
                                </div>
                                {!hasAny ? (
                                  <p className="text-sm text-muted-foreground">নিবন্ধনের সময় শিক্ষার্থীর তথ্য দেওয়া হয়নি।</p>
                                ) : (
                                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                    {duFields.map((f) => (
                                      <div
                                        key={f.label}
                                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                                      >
                                        <span className="text-xs text-muted-foreground">{f.label}</span>
                                        <span className="truncate text-sm font-medium">{f.value ?? '—'}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </TableCell>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </StaggerItem>
      )}

      {/* Ban / unban confirmation */}
      <Dialog
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
        title={banTarget?.is_active ? 'অ্যাকাউন্ট নিষ্ক্রিয় করুন' : 'অ্যাকাউন্ট সক্রিয় করুন'}
        description={
          banTarget
            ? `${banTarget.full_name ?? banTarget.email}${banTarget.is_active ? ' অ্যাকাউন্টটি নিষ্ক্রিয় (ব্যান) করা হবে।' : ' অ্যাকাউন্টটি পুনরায় সক্রিয় করা হবে।'}`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setBanTarget(null)}>
            বাতিল
          </Button>
          <Button
            variant={banTarget?.is_active ? 'destructive' : 'default'}
            onClick={confirmBan}
            disabled={busy}
          >
            {busy ? 'প্রক্রিয়া চলছে…' : banTarget?.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
          </Button>
        </div>
      </Dialog>

      {/* Remove confirmation (type name) */}
      <ConfirmDeleteDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        title="ব্যবহারকারী মুছে ফেলুন"
        name={removeTarget?.full_name ?? removeTarget?.email ?? ''}
        nameLabel="ব্যবহারকারীর নাম"
        description="এই ব্যবহারকারীর অ্যাকাউন্ট ও প্রোফাইল চিরতরে মুছে যাবে। এই কাজটি আর ফিরিয়ে আনা যাবে না।"
        confirmLabel="মুছে ফেলুন"
        isDeleting={busy}
      />
    </Stagger>
  );
}