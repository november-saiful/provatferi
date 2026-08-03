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
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-coffee-600 to-coffee-700 text-white shadow-lg shadow-coffee-500/25">
          <Music className="h-8 w-8" />
        </span>
        <Card className="mt-8 w-full shadow-lg border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">প্রভাতফেরীতে যোগ দিন</CardTitle>
            <CardDescription>
              ইভেন্টে মন্তব্য করতে এবং সদস্য অঞ্চল ব্যবহার করতে আপনার অ্যাকাউন্ট তৈরি করুন।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
