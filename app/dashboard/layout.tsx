'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-coffee-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <ShieldX className="h-12 w-12 text-taupe-400" />
        <h1 className="text-xl font-semibold">Sign in to access the dashboard</h1>
        <Button onClick={() => router.push('/login')}>Go to sign in</Button>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DashboardShell>{children}</DashboardShell>
    </AuthGate>
  );
}
