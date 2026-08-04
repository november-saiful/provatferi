'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { Seo } from '@/components/seo';
import { GoogleIcon } from '@/components/auth/google-icon';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [redirecting, setRedirecting] = React.useState(false);

  // If already signed in, go to dashboard
  React.useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  // Auto-trigger Google sign-in
  React.useEffect(() => {
    if (loading || user || redirecting) return;
    setRedirecting(true);
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    }).then(({ error }) => {
      if (error) {
        toast.error(error.message);
        setRedirecting(false);
      }
    });
  }, [loading, user, redirecting]);

  return (
    <>
      <Seo title="সাইন ইন" />
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-coffee-100 border-t-coffee-600 dark:border-coffee-900 dark:border-t-coffee-400" style={{ animationDuration: '0.8s' }} />
          <p className="text-sm text-muted-foreground">Google দিয়ে সাইন ইন হচ্ছে…</p>
        </div>
      </div>
    </>
  );
}
