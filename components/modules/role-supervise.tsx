'use client';

import * as React from 'react';
import { useRoles } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import {
  MODULE_READ,
  MODULE_WRITE,
  ROLE_NAMES,
  canPinNotices,
  canEditExpense,
  canEditBudget,
  canManageSponsors,
  canManageAttendance,
  isCommitteeMember
} from '@/lib/permissions';
import type { RoleId, ModuleId } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import {
  Eye,
  Edit,
  Shield,
  Calendar,
  Music,
  Wallet,
  Users,
  Settings,
  Pencil,
  Trash2,
  Pin,
  HandCoins,
  BarChart3,
  Image,
  type LucideIcon
} from 'lucide-react';

const MODULES: { id: ModuleId; label: string; icon: LucideIcon; description: string }[] = [
  { id: 'evf', label: 'ইভেন্ট', icon: Calendar, description: 'ইভেন্ট তৈরি, সম্পাদনা ও পরিচালনা' },
  { id: 'glr', label: 'গ্যালারি', icon: Image, description: 'ছবি ও ভিডিও আপলোড' },
  { id: 'cln', label: 'ক্যালেন্ডার', icon: Calendar, description: 'ক্যালেন্ডার ইভেন্ট' },
  { id: 'ntb', label: 'নোটিশ', icon: Pencil, description: 'নোটিশ প্রকাশ ও পিন' },
  { id: 'dnt', label: 'অনুদান', icon: HandCoins, description: 'অনুদান ব্যবস্থাপনা' },
  { id: 'spn', label: 'স্পনসর', icon: Users, description: 'স্পনসর ব্যবস্থাপনা' },
  { id: 'xpm', label: 'ব্যয়', icon: Wallet, description: 'ব্যয় রেকর্ড' },
  { id: 'bgm', label: 'বাজেট', icon: Wallet, description: 'বাজেট বরাদ্দ' },
  { id: 'rcd', label: 'রেকর্ড', icon: Edit, description: 'অডিট লগ' },
  { id: 'cia', label: 'উপস্থিতি', icon: Music, description: 'কোর্স উপস্থিতি' },
  { id: 'coi', label: 'বিশ্লেষণ', icon: BarChart3, description: 'ডেটা বিশ্লেষণ' },
  { id: 'admin', label: 'অ্যাডমিন', icon: Settings, description: 'ব্যবহারকারী ব্যবস্থাপনা' }
];

const EXTRA_PERMISSIONS: { key: string; label: string; check: (role: RoleId) => boolean }[] = [
  { key: 'pin_notices', label: 'নোটিশ পিন করা', check: (r) => canPinNotices(r) },
  { key: 'edit_expense', label: 'ব্যয় সম্পাদনা', check: (r) => canEditExpense(r) },
  { key: 'edit_budget', label: 'বাজেট সম্পাদনা', check: (r) => canEditBudget(r) },
  { key: 'manage_sponsors', label: 'স্পনসর ব্যবস্থাপনা', check: (r) => canManageSponsors(r) },
  { key: 'manage_attendance', label: 'উপস্থিতি ব্যবস্থাপনা', check: (r) => canManageAttendance(r) },
  { key: 'is_committee', label: 'কমিটি সদস্য', check: (r) => isCommitteeMember(r) }
];

export function RoleSupervise() {
  const { data: roles, isLoading } = useRoles();
  const { profile } = useAuthStore();
  const [selectedRole, setSelectedRole] = React.useState<RoleId | null>(null);

  const userRole = profile?.role_id;
  const canEdit = userRole === 'root' || userRole === 'pr' || userRole === 'admin';

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const allRoles = (roles ?? [])
    .filter((r) => r.id !== 'visitor')
    .sort((a, b) => a.display_order - b.display_order);

  const selectedRoleData = allRoles.find((r) => r.id === selectedRole);

  return (
    <Stagger className="space-y-6">
      <StaggerItem>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">রোল সুপারভাইজ</h2>
            <p className="text-sm text-muted-foreground">
              প্রতিটি ভূমিকার অনুমতি ও ক্ষমতা দেখুন
            </p>
          </div>
          {canEdit && (
            <Badge variant="outline" className="text-xs">
              <Shield className="mr-1 h-3 w-3" />
              সম্পাদনা অনুমতি আছে
            </Badge>
          )}
        </div>
      </StaggerItem>

      {/* Role Cards Grid */}
      <StaggerItem>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allRoles.map((r) => {
            const roleId = r.id as RoleId;
            const isMe = profile?.role_id === roleId;
            const isSelected = selectedRole === roleId;

            return (
              <Card
                key={r.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isMe && 'ring-2 ring-primary',
                  isSelected && 'ring-2 ring-primary shadow-md'
                )}
                onClick={() => setSelectedRole(isSelected ? null : roleId)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{ROLE_NAMES[roleId] ?? r.name}</CardTitle>
                    {isMe && (
                      <Badge variant="default" className="text-[10px]">
                        আপনি
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Module Access Summary */}
                    <div className="flex flex-wrap gap-1">
                      {MODULES.slice(0, 6).map((m) => {
                        const hasWrite = (MODULE_WRITE[m.id] ?? []).includes(roleId);
                        const hasRead = (MODULE_READ[m.id] ?? []).includes(roleId);
                        if (!hasRead && !hasWrite) return null;
                        return (
                          <Badge
                            key={m.id}
                            variant={hasWrite ? 'default' : 'secondary'}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {m.label}
                          </Badge>
                        );
                      })}
                      {MODULES.filter((m) => {
                        const hasWrite = (MODULE_WRITE[m.id] ?? []).includes(roleId);
                        const hasRead = (MODULE_READ[m.id] ?? []).includes(roleId);
                        return hasRead || hasWrite;
                      }).length > 6 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{MODULES.filter((m) => {
                            const hasWrite = (MODULE_WRITE[m.id] ?? []).includes(roleId);
                            const hasRead = (MODULE_READ[m.id] ?? []).includes(roleId);
                            return hasRead || hasWrite;
                          }).length - 6}
                        </Badge>
                      )}
                    </div>

                    {/* Extra Permissions */}
                    <div className="flex flex-wrap gap-1">
                      {EXTRA_PERMISSIONS.filter((p) => p.check(roleId)).slice(0, 3).map((p) => (
                        <Badge key={p.key} variant="outline" className="text-[10px] px-1.5 py-0">
                          {p.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </StaggerItem>

      {/* Selected Role Details */}
      {selectedRole && selectedRoleData && (
        <StaggerItem>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{ROLE_NAMES[selectedRole] ?? selectedRoleData.name}</CardTitle>
                {canEdit && (
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    সম্পাদনা করুন
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Module Permissions Table */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">মডিউল অনুমতি</h3>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-3 py-2 text-left font-semibold">মডিউল</th>
                          <th className="px-3 py-2 text-center font-semibold">পড়া</th>
                          <th className="px-3 py-2 text-center font-semibold">লেখা</th>
                          <th className="px-3 py-2 text-left font-semibold">বিবরণ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MODULES.map((m) => {
                          const hasRead = (MODULE_READ[m.id] ?? []).includes(selectedRole);
                          const hasWrite = (MODULE_WRITE[m.id] ?? []).includes(selectedRole);
                          const Icon = m.icon;
                          return (
                            <tr key={m.id} className="border-b border-border last:border-0">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{m.label}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={cn(
                                  'inline-flex h-6 w-6 items-center justify-center rounded-full',
                                  hasRead ? 'bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-300' : 'bg-muted text-muted-foreground'
                                )}>
                                  <Eye className="h-3.5 w-3.5" />
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={cn(
                                  'inline-flex h-6 w-6 items-center justify-center rounded-full',
                                  hasWrite ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                )}>
                                  <Edit className="h-3.5 w-3.5" />
                                </span>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{m.description}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Extra Capabilities */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">অতিরিক্ত ক্ষমতা</h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {EXTRA_PERMISSIONS.map((p) => {
                      const hasPermission = p.check(selectedRole);
                      return (
                        <div
                          key={p.key}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border p-3',
                            hasPermission ? 'border-sage-200 bg-sage-50 dark:border-sage-800 dark:bg-sage-900/20' : 'border-border bg-muted/30'
                          )}
                        >
                          <span className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full',
                            hasPermission ? 'bg-sage-500 text-white' : 'bg-muted text-muted-foreground'
                          )}>
                            {hasPermission ? '✓' : '—'}
                          </span>
                          <span className={cn(
                            'text-sm',
                            hasPermission ? 'font-medium text-sage-700 dark:text-sage-300' : 'text-muted-foreground'
                          )}>
                            {p.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      )}
    </Stagger>
  );
}
