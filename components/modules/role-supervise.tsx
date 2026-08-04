'use client';

import * as React from 'react';
import { useRoles, useRolePermissions, useRoleExtraPermissions, useUpdateRolePermission, useUpdateRoleExtraPermissions } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { ROLE_NAMES } from '@/lib/permissions';
import type { RoleId, ModuleId } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
  Save,
  X,
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

const EXTRA_PERMISSIONS: { key: string; label: string; description: string }[] = [
  { key: 'pin_notices', label: 'নোটিশ পিন করা', description: 'নোটিশ পিন/আনপিন করতে পারবেন' },
  { key: 'edit_expense', label: 'ব্যয় সম্পাদনা', description: 'ব্যয় রেকর্ড সম্পাদনা করতে পারবেন' },
  { key: 'edit_budget', label: 'বাজেট সম্পাদনা', description: 'বাজেট সম্পাদনা করতে পারবেন' },
  { key: 'manage_sponsors', label: 'স্পনসর ব্যবস্থাপনা', description: 'স্পনসর যোগ/সম্পাদনা করতে পারবেন' },
  { key: 'manage_attendance', label: 'উপস্থিতি ব্যবস্থাপনা', description: 'কোর্স উপস্থিতি ব্যবস্থাপনা করতে পারবেন' }
];

export function RoleSupervise() {
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: rolePermissions, isLoading: permsLoading } = useRolePermissions();
  const { data: extraPermissions, isLoading: extrasLoading } = useRoleExtraPermissions();
  const { profile } = useAuthStore();
  const updatePermission = useUpdateRolePermission();
  const updateExtraPermissions = useUpdateRoleExtraPermissions();

  const [selectedRole, setSelectedRole] = React.useState<RoleId | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [localPermissions, setLocalPermissions] = React.useState<Map<string, { canRead: boolean; canWrite: boolean }>>(new Map());
  const [localExtra, setLocalExtra] = React.useState<Map<string, Record<string, boolean>>>(new Map());

  const userRole = profile?.role_id;
  const canEdit = userRole === 'root' || userRole === 'pr' || userRole === 'admin';

  const isLoading = rolesLoading || permsLoading || extrasLoading;

  // Initialize local state when role is selected for editing
  React.useEffect(() => {
    if (selectedRole && isEditing && rolePermissions && extraPermissions) {
      const newPerms = new Map<string, { canRead: boolean; canWrite: boolean }>();
      const newExtra = new Map<string, Record<string, boolean>>();

      // Initialize module permissions
      for (const mod of MODULES) {
        const existing = rolePermissions.find(
          (p) => p.role_id === selectedRole && p.module_id === mod.id
        );
        newPerms.set(mod.id, {
          canRead: existing?.can_read ?? false,
          canWrite: existing?.can_write ?? false
        });
      }

      // Initialize extra permissions
      const existingExtra = extraPermissions.find((p) => p.role_id === selectedRole);
      newExtra.set(selectedRole, {
        pin_notices: existingExtra?.pin_notices ?? false,
        edit_expense: existingExtra?.edit_expense ?? false,
        edit_budget: existingExtra?.edit_budget ?? false,
        manage_sponsors: existingExtra?.manage_sponsors ?? false,
        manage_attendance: existingExtra?.manage_attendance ?? false
      });

      setLocalPermissions(newPerms);
      setLocalExtra(newExtra);
    }
  }, [selectedRole, isEditing, rolePermissions, extraPermissions]);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const allRoles = (roles ?? [])
    .filter((r) => r.id !== 'visitor')
    .sort((a, b) => a.display_order - b.display_order);

  const getModulePermission = (roleId: RoleId, moduleId: ModuleId) => {
    if (isEditing && selectedRole === roleId) {
      return localPermissions.get(moduleId) ?? { canRead: false, canWrite: false };
    }
    const perm = rolePermissions?.find((p) => p.role_id === roleId && p.module_id === moduleId);
    return { canRead: perm?.can_read ?? false, canWrite: perm?.can_write ?? false };
  };

  const getExtraPermission = (roleId: RoleId, key: string) => {
    if (isEditing && selectedRole === roleId) {
      return localExtra.get(roleId)?.[key] ?? false;
    }
    const extra = extraPermissions?.find((p) => p.role_id === roleId);
    if (!extra) return false;
    switch (key) {
      case 'pin_notices': return extra.pin_notices;
      case 'edit_expense': return extra.edit_expense;
      case 'edit_budget': return extra.edit_budget;
      case 'manage_sponsors': return extra.manage_sponsors;
      case 'manage_attendance': return extra.manage_attendance;
      default: return false;
    }
  };

  const toggleModuleRead = (moduleId: ModuleId) => {
    if (!selectedRole) return;
    const current = localPermissions.get(moduleId) ?? { canRead: false, canWrite: false };
    const newPerms = new Map(localPermissions);
    newPerms.set(moduleId, { ...current, canRead: !current.canRead });
    setLocalPermissions(newPerms);
  };

  const toggleModuleWrite = (moduleId: ModuleId) => {
    if (!selectedRole) return;
    const current = localPermissions.get(moduleId) ?? { canRead: false, canWrite: false };
    const newPerms = new Map(localPermissions);
    // If enabling write, also enable read
    newPerms.set(moduleId, {
      canRead: current.canRead || !current.canWrite,
      canWrite: !current.canWrite
    });
    setLocalPermissions(newPerms);
  };

  const toggleExtraPermission = (key: string) => {
    if (!selectedRole) return;
    const current = localExtra.get(selectedRole) ?? {};
    const newExtra = new Map(localExtra);
    newExtra.set(selectedRole, { ...current, [key]: !current[key] });
    setLocalExtra(newExtra);
  };

  const handleSave = async () => {
    if (!selectedRole) return;

    try {
      // Save module permissions
      for (const mod of MODULES) {
        const perm = localPermissions.get(mod.id);
        if (perm) {
          await updatePermission.mutateAsync({
            roleId: selectedRole,
            moduleId: mod.id,
            canRead: perm.canRead,
            canWrite: perm.canWrite
          });
        }
      }

      // Save extra permissions
      const extra = localExtra.get(selectedRole);
      if (extra) {
        await updateExtraPermissions.mutateAsync({
          roleId: selectedRole,
          permissions: extra
        });
      }

      toast.success('অনুমতি সফলভাবে সংরক্ষিত হয়েছে!');
      setIsEditing(false);
    } catch (error) {
      toast.error('অনুমতি সংরক্ষণে সমস্যা হয়েছে');
      console.error(error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLocalPermissions(new Map());
    setLocalExtra(new Map());
  };

  return (
    <div className="space-y-6">
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

      {/* Role Cards with inline details */}
      <div className="space-y-4">
        {allRoles.map((r) => {
          const roleId = r.id as RoleId;
          const isMe = profile?.role_id === roleId;
          const isSelected = selectedRole === roleId;

          return (
            <div key={r.id}>
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isMe && 'ring-2 ring-primary',
                  isSelected && 'ring-2 ring-primary shadow-md'
                )}
                onClick={() => {
                  if (isSelected) {
                    setSelectedRole(null);
                    setIsEditing(false);
                  } else {
                    setSelectedRole(roleId);
                    setIsEditing(false);
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{ROLE_NAMES[roleId] ?? r.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {isMe && (
                        <Badge variant="default" className="text-[10px]">
                          আপনি
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {MODULES.slice(0, 6).map((m) => {
                      const perm = getModulePermission(roleId, m.id);
                      if (!perm.canRead && !perm.canWrite) return null;
                      return (
                        <Badge
                          key={m.id}
                          variant={perm.canWrite ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {m.label}
                        </Badge>
                      );
                    })}
                    {MODULES.filter((m) => {
                      const perm = getModulePermission(roleId, m.id);
                      return perm.canRead || perm.canWrite;
                    }).length > 6 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        +{MODULES.filter((m) => {
                          const perm = getModulePermission(roleId, m.id);
                          return perm.canRead || perm.canWrite;
                        }).length - 6}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Inline Details for Selected Role */}
              {isSelected && (
                <Card className="mt-2 border-primary/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {ROLE_NAMES[roleId] ?? r.name} — {isEditing ? 'সম্পাদনা মোড' : 'বিস্তারিত'}
                      </CardTitle>
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={handleSave}
                                disabled={updatePermission.isPending || updateExtraPermissions.isPending}
                              >
                                <Save className="mr-2 h-4 w-4" />
                                {updatePermission.isPending || updateExtraPermissions.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                              </Button>
                              <Button variant="outline" size="sm" onClick={handleCancel}>
                                <X className="mr-2 h-4 w-4" />
                                বাতিল
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                              <Settings className="mr-2 h-4 w-4" />
                              সম্পাদনা করুন
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {/* Module Permissions Table */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold">মডিউল অনুমতি</h4>
                        <div className="overflow-x-auto rounded-lg border border-border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/50">
                                <th className="px-3 py-1.5 text-left font-semibold">মডিউল</th>
                                <th className="px-3 py-1.5 text-center font-semibold">পড়া</th>
                                <th className="px-3 py-1.5 text-center font-semibold">লেখা</th>
                                <th className="px-3 py-1.5 text-left font-semibold">বিবরণ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {MODULES.map((m) => {
                                const perm = getModulePermission(roleId, m.id);
                                const Icon = m.icon;
                                return (
                                  <tr key={m.id} className="border-b border-border last:border-0">
                                    <td className="px-3 py-1.5">
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="font-medium">{m.label}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-1.5 text-center">
                                      {isEditing ? (
                                        <Switch
                                          checked={perm.canRead}
                                          onCheckedChange={() => toggleModuleRead(m.id)}
                                          className="scale-75"
                                        />
                                      ) : (
                                        <span className={cn(
                                          'inline-flex h-5 w-5 items-center justify-center rounded-full',
                                          perm.canRead ? 'bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-300' : 'bg-muted text-muted-foreground'
                                        )}>
                                          <Eye className="h-3 w-3" />
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-1.5 text-center">
                                      {isEditing ? (
                                        <Switch
                                          checked={perm.canWrite}
                                          onCheckedChange={() => toggleModuleWrite(m.id)}
                                          className="scale-75"
                                        />
                                      ) : (
                                        <span className={cn(
                                          'inline-flex h-5 w-5 items-center justify-center rounded-full',
                                          perm.canWrite ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                        )}>
                                          <Edit className="h-3 w-3" />
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{m.description}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Extra Capabilities */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold">অতিরিক্ত ক্ষমতা</h4>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {EXTRA_PERMISSIONS.map((p) => {
                            const hasPermission = getExtraPermission(roleId, p.key);
                            return (
                              <div
                                key={p.key}
                                className={cn(
                                  'flex items-center justify-between rounded-lg border p-2.5',
                                  hasPermission ? 'border-sage-200 bg-sage-50 dark:border-sage-800 dark:bg-sage-900/20' : 'border-border bg-muted/30'
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                                    hasPermission ? 'bg-sage-500 text-white' : 'bg-muted text-muted-foreground'
                                  )}>
                                    {hasPermission ? '✓' : '—'}
                                  </span>
                                  <div>
                                    <span className={cn(
                                      'text-xs font-medium',
                                      hasPermission ? 'text-sage-700 dark:text-sage-300' : 'text-muted-foreground'
                                    )}>
                                      {p.label}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground">{p.description}</p>
                                  </div>
                                </div>
                                {isEditing && (
                                  <Switch
                                    checked={hasPermission}
                                    onCheckedChange={() => toggleExtraPermission(p.key)}
                                    className="scale-75"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
