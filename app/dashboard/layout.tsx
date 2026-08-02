'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldX } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <motion.div
        className="flex min-h-screen items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-coffee-100 border-t-coffee-600 dark:border-coffee-900 dark:border-t-coffee-400"
          style={{ animationDuration: '0.8s' }}
        />
      </motion.div>
    );
  }

  if (!user) {
    return (
      <motion.div
        className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ShieldX className="h-12 w-12 text-taupe-400" />
        <h1 className="text-xl font-semibold">ড্যাশবোর্ডে প্রবেশ করতে সাইন ইন করুন</h1>
        <Button onClick={() => router.push('/login')}>সাইন ইন করতে যান</Button>
      </motion.div>
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
