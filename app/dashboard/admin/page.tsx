'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/auth/role-guard';

export default function DashboardAdminPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/dashboard/admin/users');
  }, [router]);

  return <RoleGuard allowedRoles={['pr', 'vp']}>Redirecting…</RoleGuard>;
}
