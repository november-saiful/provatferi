'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);

  React.useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session ? { id: session.user.id, email: session.user.email ?? '' } : null);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        setProfile(data ?? null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? { id: session.user.id, email: session.user.email ?? '' } : null);
      if (!session) {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [setUser, setProfile, setLoading]);

  return <>{children}</>;
}
