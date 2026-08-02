'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Music } from 'lucide-react';
import { PublicShell } from '@/components/layout/dashboard-shell';
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
    <PublicShell>
      <Seo title="অ্যাকাউন্ট তৈরি করুন" />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coffee-600 text-white">
          <Music className="h-7 w-7" />
        </span>
        <Card className="mt-6 w-full">
          <CardHeader>
            <CardTitle>প্রভাতফেরীতে যোগ দিন</CardTitle>
            <CardDescription>ইভেন্টে মন্তব্য করতে এবং সদস্য অঞ্চল ব্যবহার করতে আপনার অ্যাকাউন্ট তৈরি করুন।</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
