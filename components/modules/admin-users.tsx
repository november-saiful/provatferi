'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useProfiles, useRoles } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { ROLE_NAMES } from '@/lib/permissions';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { UserCog } from 'lucide-react';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import type { Profile } from '@/lib/types';

// Naming convention: {lowercase_role_code}-{number} (e.g. pr-1, pr-2 … or pr-01).
// Accepts 1–2 digits so legacy single-digit ids (cc-2) are valid too.
const DISPLAY_ID_RE = /^[a-z]+-\d{1,2}$/;

export function AdminUsers() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { data: profiles, isLoading } = useProfiles(true);
  const { data: roles } = useRoles();

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
      toast.error('You cannot change your own role');
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
    toast.success(patch.display_id ? `Role updated — display ID set to ${patch.display_id}` : 'Role updated');
    qc.invalidateQueries({ queryKey: ['profiles'] });
  };

  const saveDisplayId = async (userId: string, value: string) => {
    const v = value.trim();
    if (v && !DISPLAY_ID_RE.test(v)) {
      toast.error('Display ID must be {role}-{N}, e.g. pr-1 or pr-01');
      return;
    }
    // Reject ids already held by another profile — manual entry must not
    // reintroduce the duplicate the auto-suggestion bug used to create.
    if (v) {
      const taken = (profiles ?? []).some((p) => p.id !== userId && p.display_id === v);
      if (taken) {
        toast.error(`Display ID ${v} is already taken by another user`);
        return;
      }
    }
    const { error } = await supabase.from('profiles').update({ display_id: v || null }).eq('id', userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Display ID updated');
      qc.invalidateQueries({ queryKey: ['profiles'] });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!profiles || profiles.length === 0) {
    return <EmptyState title="No users yet" description="Users appear after they sign up." />;
  }

  // Match the role's existing id style (cc-01 padded vs cc-1 plain) for the hint.
  const displayIdPlaceholder = (roleId: string): string =>
    `${roleId}-${roleUsesPaddedIds(roleId) ? '01' : '1'}`;

  return (
    <Stagger className="space-y-4">
      <StaggerItem className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <UserCog className="h-4 w-4" />
        {profiles.length} registered profiles
        <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs">
          Display ID: role-{'N'} (e.g. pr-1) — auto-assigned with the next free number on role change
        </span>
      </StaggerItem>
      <StaggerItem>
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Display ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Change role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((p) => (
            <TableRow key={p.id}>
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
                  aria-label="Display ID"
                />
              </TableCell>
              <TableCell className="text-muted-foreground">{p.email}</TableCell>
              <TableCell>
                <Badge variant="coffee">{ROLE_NAMES[p.role_id] ?? p.role_id}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
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
          ))}
        </TableBody>
        </Table>
      </StaggerItem>
    </Stagger>
  );
}
