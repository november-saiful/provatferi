'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { RoleId } from '@/lib/types';

interface RoleGuardProps {
  allowedRoles?: RoleId[];
  allowSignedIn?: boolean;
  children: React.ReactNode;
  fallbackClassName?: string;
}

export function RoleGuard({ allowedRoles, allowSignedIn = false, children, fallbackClassName }: RoleGuardProps) {
  const router = useRouter();
  const { user, role, loading } = useAuthStore();

  if (loading) {
    return (
      <div className={cn('space-y-3 p-4', fallbackClassName)}>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-4 py-24 text-center', fallbackClassName)}>
        <ShieldX className="h-12 w-12 text-taupe-400" />
        <div>
          <h2 className="text-xl font-semibold">সাইন ইন প্রয়োজন</h2>
          <p className="mt-1 text-sm text-muted-foreground">এই পেজে প্রবেশ করতে সাইন ইন করুন।</p>
        </div>
        <Button onClick={() => router.push('/login')}>সাইন ইন করতে যান</Button>
      </div>
    );
  }

  const permitted = allowSignedIn || (allowedRoles ? !!role && allowedRoles.includes(role) : true);

  if (!permitted) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-4 py-24 text-center', fallbackClassName)}>
        <ShieldX className="h-12 w-12 text-warmred-400" />
        <div>
          <h2 className="text-xl font-semibold">৪০৩ — পর্যাপ্ত অনুমতি নেই</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            আপনার ভূমিকা ({role}) এই মডিউলে প্রবেশাধিকার রাখে না। এটি ভুল মনে হলে সভাপতি বা সহ-সভাপতির সাথে যোগাযোগ
            করুন।
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          ড্যাশবোর্ডে ফিরুন
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
