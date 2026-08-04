'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  React.useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  return (
    <PublicShell>
      <Seo title="সাইন ইন" />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
        <p className="text-center text-lg font-medium tracking-tight text-coffee-800 dark:text-coffee-200">
          ভোরের আলোর মতোই শুরু হোক আপনার যাত্রা
        </p>
        <Card className="mt-6 w-full shadow-lg border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">আবারও স্বাগতম</CardTitle>
            <CardDescription>আপনার প্রভাতফেরী অ্যাকাউন্টে সাইন ইন করুন।</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
