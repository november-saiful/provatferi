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
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { UserCog } from 'lucide-react';

export function AdminUsers() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { data: profiles, isLoading } = useProfiles(true);
  const { data: roles } = useRoles();

  const changeRole = async (userId: string, roleId: string) => {
    if (userId === user?.id) {
      toast.error('You cannot change your own role');
      return;
    }
    const { error } = await supabase.from('profiles').update({ role_id: roleId }).eq('id', userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['profiles'] });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!profiles || profiles.length === 0) {
    return <EmptyState title="No users yet" description="Users appear after they sign up." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <UserCog className="h-4 w-4" />
        {profiles.length} registered profiles
      </div>
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
              <TableCell className="font-mono text-xs">{p.display_id ?? '—'}</TableCell>
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
    </div>
  );
}
