'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import type { Profile } from '@/lib/types';

const COMPLETE_PATH = '/register/complete-profile';

function needsCompletion(p: Profile): boolean {
  return !(p.academic_session && p.department && p.hall_name && p.reg_id);
}

/**
 * Global auth wiring:
 *  - loads the profile into the store,
 *  - kicks users whose account was banned (is_active = false),
 *  - routes OAuth (Google) sign-ups without DU info to the completion form.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);
  const router = useRouter();
  const pathname = usePathname();

  const handledRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const handleProfile = async (profile: Profile | null) => {
      setProfile(profile ?? null);
      if (!profile) return;

      if (handledRef.current === profile.id) return;
      handledRef.current = profile.id;

      if (!profile.is_active) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        toast.error('এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। বিস্তারিত জানতে কমিটির সাথে যোগাযোগ করুন।');
        return;
      }

      if (
        profile.role_id === 'visitor' &&
        needsCompletion(profile) &&
        pathname !== COMPLETE_PATH &&
        !cancelled
      ) {
        router.replace(COMPLETE_PATH);
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      setUser(session ? { id: session.user.id, email: session.user.email ?? '' } : null);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        await handleProfile((data as Profile) ?? null);
      } else {
        setProfile(null);
      }
      if (!cancelled) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session ? { id: session.user.id, email: session.user.email ?? '' } : null);
      if (!session) {
        setProfile(null);
        handledRef.current = null;
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      await handleProfile((data as Profile) ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);

  return <>{children}</>;
}