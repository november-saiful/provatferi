'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useProfiles, useRoles } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { ROLE_NAMES } from '@/lib/permissions';
import { formatDate, cn, toBengaliDigits } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { UserCog, ChevronDown, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stagger, StaggerItem, EASE } from '@/components/ui/motion';
import type { Profile } from '@/lib/types';

// Naming convention: {lowercase_role_code}-{number} (e.g. pr-1, pr-2 … or pr-01).
// Accepts 1–2 digits so legacy single-digit ids (cc-2) are valid too.
const DISPLAY_ID_RE = /^[a-z]+-\d{1,2}$/;

export function AdminUsers() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { data: profiles, isLoading } = useProfiles(true);
  const { data: roles } = useRoles();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Does this role use zero-padded ids (cc-01) or plain (cc-1)?
  const roleUsesPaddedIds = (roleId: string): boolean =>
    (profiles ?? []).some((p) => {
      const m = p.display_id?.match(/^([a-z]+)-(\d+)$/);
      return !!m && m[1] === roleId && m[2].length === 2 && m[2].startsWith('0');
    });

  const suggestDisplayId = (roleId: string): string => {
    // Count ANY digit suffix (1+ digits) so single-digit ids like cc-2 are seen.
    const matches = (profiles ?? [])
      .map((p) => p.display_id?.match(/^([a-z]+)-(\d+)$/))
      .filter((m): m is RegExpMatchArray => !!m && m[1] === roleId);
    const used = matches.map((m) => parseInt(m[2], 10));
    const next = (used.length ? Math.max(...used) : 0) + 1;
    // Follow the role's existing style: zero-padded (cc-02) stays padded,
    // plain (cc-2) stays plain — so a role with cc-2 continues to cc-3.
    const padded = roleUsesPaddedIds(roleId);
    return `${roleId}-${padded ? String(next).padStart(2, '0') : String(next)}`;
  };

  const changeRole = async (userId: string, roleId: string) => {
    if (userId === user?.id) {
      toast.error('আপনি নিজের ভূমিকা পরিবর্তন করতে পারবেন না');
      return;
    }
    const target = profiles?.find((p) => p.id === userId);
    const current = target?.display_id ?? '';
    // Auto-assign a valid display_id when missing or prefixed with the old role
    const patch: { role_id: string; display_id?: string } = { role_id: roleId };
    if (!DISPLAY_ID_RE.test(current) || !current.startsWith(`${roleId}-`)) {
      patch.display_id = suggestDisplayId(roleId);
    }
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select('*')
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    // Patch the local cache immediately so the very next suggestion for this
    // role sees the freshly assigned id — prevents duplicate numbers when
    // assigning several users to the same role in a row.
    if (updated) {
      qc.setQueryData<Profile[]>(['profiles'], (old) =>
        (old ?? []).map((p) => (p.id === userId ? (updated as Profile) : p))
      );
    }
    toast.success(patch.display_id ? `ভূমিকা আপডেট হয়েছে — ডিসপ্লে আইডি ${patch.display_id} নির্ধারণ করা হয়েছে` : 'ভূমিকা আপডেট হয়েছে');
    qc.invalidateQueries({ queryKey: ['profiles'] });
  };

  const saveDisplayId = async (userId: string, value: string) => {
    const v = value.trim();
    if (v && !DISPLAY_ID_RE.test(v)) {
      toast.error('ডিসপ্লে আইডি অবশ্যই {role}-{N} ফরম্যাটে হতে হবে, যেমন pr-1 বা pr-01');
      return;
    }
    // Reject ids already held by another profile — manual entry must not
    // reintroduce the duplicate the auto-suggestion bug used to create.
    if (v) {
      const taken = (profiles ?? []).some((p) => p.id !== userId && p.display_id === v);
      if (taken) {
        toast.error(`ডিসপ্লে আইডি ${v} অন্য একজন ব্যবহারকারী নিয়ে রেখেছেন`);
        return;
      }
    }
    const { error } = await supabase.from('profiles').update({ display_id: v || null }).eq('id', userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('ডিসপ্লে আইডি আপডেট হয়েছে');
      qc.invalidateQueries({ queryKey: ['profiles'] });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!profiles || profiles.length === 0) {
    return <EmptyState title="এখনো কোনো ব্যবহারকারী নেই" description="সাইন আপ করার পর ব্যবহারকারীরা দেখা যাবে।" />;
  }

  // Match the role's existing id style (cc-01 padded vs cc-1 plain) for the hint.
  const displayIdPlaceholder = (roleId: string): string =>
    `${roleId}-${roleUsesPaddedIds(roleId) ? '01' : '1'}`;

  return (
    <Stagger className="space-y-4">
      <StaggerItem className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <UserCog className="h-4 w-4" />
        {toBengaliDigits(profiles.length)}টি নিবন্ধিত প্রোফাইল
        <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs">
          ডিসপ্লে আইডি: role-{'N'} (যেমন pr-1) — ভূমিকা পরিবর্তনে পরবর্তী খালি নম্বর স্বয়ংক্রিয়ভাবে দেওয়া হয়
        </span>
      </StaggerItem>
      <StaggerItem>
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" aria-label="ঢাকা বিশ্ববিদ্যালয়ের তথ্য" />
            <TableHead>ব্যবহারকারী</TableHead>
            <TableHead>ডিসপ্লে আইডি</TableHead>
            <TableHead>ইমেইল</TableHead>
            <TableHead>ভূমিকা</TableHead>
            <TableHead>সক্রিয়</TableHead>
            <TableHead>যোগদান</TableHead>
            <TableHead className="text-right">ভূমিকা পরিবর্তন</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((p) => {
            const isOpen = expandedId === p.id;
            const duFields = [
              { label: 'শিক্ষাবর্ষ', value: p.academic_session },
              { label: 'বিভাগ', value: p.department },
              { label: 'হলের নাম', value: p.hall_name },
              { label: 'রেজিস্ট্রেশন আইডি', value: p.reg_id },
              { label: 'মোবাইল', value: p.phone }
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
              <TableCell>
                <Input
                  key={p.id}
                  defaultValue={p.display_id ?? ''}
                  placeholder={displayIdPlaceholder(p.role_id)}
                  className="h-7 w-24 font-mono text-xs"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (p.display_id ?? '')) saveDisplayId(p.id, v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  aria-label="ডিসপ্লে আইডি"
                />
              </TableCell>
              <TableCell className="text-muted-foreground">{p.email}</TableCell>
              <TableCell>
                <Badge variant="coffee">{ROLE_NAMES[p.role_id] ?? p.role_id}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(p.created_at)}</TableCell>
              <TableCell className="text-right">
                <Select
                  value={p.role_id}
                  onChange={(e) => changeRole(p.id, e.target.value)}
                  className="h-8 w-44 text-xs"
                  disabled={p.id === user?.id}
                >
                  {roles?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </TableCell>
            </TableRow>
            <AnimatePresence initial={false}>
              {isOpen && (
                <tr key={`${p.id}-du`} id={`du-${p.id}`}>
                  <TableCell colSpan={8} className="bg-muted/25 p-0">
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
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          )})}
        </TableBody>
        </Table>
      </StaggerItem>
    </Stagger>
  );
}
