'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Music } from 'lucide-react';
import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RegisterForm } from '@/components/auth/register-form';
import { useAuthStore } from '@/lib/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  React.useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  return (
    <>
      <Seo title="Create account" />
      <PublicNav />
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coffee-600 text-white">
          <Music className="h-7 w-7" />
        </span>
        <Card className="mt-6 w-full">
          <CardHeader>
            <CardTitle>Join Provatferi</CardTitle>
            <CardDescription>Create your account to comment on events and access member areas.</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </main>
      <PublicFooter />
    </>
  );
}
