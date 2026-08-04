'use client';

import { isSupabaseConfigured } from '@/lib/supabase/client';
import { GoogleButton } from './google-button';

export function LoginForm() {
  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Supabase কনফিগার করা নেই। <code>NEXT_PUBLIC_SUPABASE_URL</code> এবং{' '}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> এনভায়রনমেন্টে যোগ করুন।
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <GoogleButton label="Google দিয়ে সাইন ইন করুন" />
    </div>
  );
}