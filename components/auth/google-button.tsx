'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { GoogleIcon } from './google-icon';

/**
 * Google OAuth sign-in. After the redirect we check whether the profile has
 * completed its DU info; if not, the AuthProvider routes the user to the
 * completion form.
 */
export function GoogleButton({ label = 'Google দিয়ে চলুন' }: { label?: string }) {
  const [loading, setLoading] = React.useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      });
      if (error) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className="theme-surface relative flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-input bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <GoogleIcon className="h-5 w-5" />
      {loading ? 'অপেক্ষা করুন…' : label}
    </button>
  );
}