'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { isCommitteeMember } from '@/lib/permissions';
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
 *  - auto-saves Google profile picture for committee members.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);
  const profileRoleId = useAuthStore((s) => s.profile?.role_id);
  const router = useRouter();
  const pathname = usePathname();

  const handledRef = React.useRef<string | null>(null);

  /**
   * If the user signed in via Google and has no avatar yet, persist the
   * Google profile picture URL — but only for committee members.
   */
  const handleProfile = React.useCallback(
    async (profile: Profile | null, cancelled?: boolean) => {
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
    },
    [pathname, router, setUser, setProfile]
  );

  React.useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      setUser(session ? { id: session.user.id, email: session.user.email ?? '' } : null);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        await handleProfile((data as Profile) ?? null, cancelled);
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
      await handleProfile((data as Profile) ?? null, cancelled);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);

  // ── Live profile sync (Realtime) ─────────────────────────────────────
  // When an admin promotes/demotes the current user while they're logged in,
  // the change appears instantly — no page refresh needed.  The updated
  // profile flows into profileRoleId which triggers the avatar sync below.
  React.useEffect(() => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const channel = supabase
      .channel(`profile-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        async () => {
          // Re-fetch the full profile so every field (role, avatar, name…)
          // is up to date.
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          if (data) {
            useAuthStore.getState().setProfile(data as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [useAuthStore.getState().user?.id]);

  // ── Clear avatar on demotion ────────────────────────────────────────
  // When a committee member is demoted to visitor/alumni, remove their
  // avatar so non-committee users never have profile pictures stored.
  React.useEffect(() => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    if (isCommitteeMember(profile.role_id)) return; // still committee
    if (!profile.avatar_url) return; // nothing to clear

    // Suppress the Google avatar sync from re-adding it.
    let cancelled = false;

    (async () => {
      try {
        await supabase
          .from('profiles')
          .update({ avatar_url: null })
          .eq('id', profile.id);

        if (cancelled) return;

        // If the avatar was a Supabase storage file (not an external Google
        // URL), delete it to free storage.
        const url = profile.avatar_url ?? '';
        const marker = '/object/public/profiles/';
        const idx = url.indexOf(marker);
        if (idx !== -1) {
          const path = url.slice(idx + marker.length);
          await supabase.storage.from('profiles').remove([path]);
        }

        const current = useAuthStore.getState().profile;
        if (current && !cancelled) {
          useAuthStore.getState().setProfile({ ...current, avatar_url: null });
        }
      } catch (err) {
        console.warn('Avatar cleanup on demotion failed:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [profileRoleId]);

  // ── Google avatar sync ──────────────────────────────────────────────
  // Runs independently of handleProfile so a role change (visitor →
  // committee) still triggers the sync even though handledRef already
  // fired for this profile.  Idempotent: skips if avatar_url is set or
  // the user is not a committee member.
  React.useEffect(() => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    if (profile.avatar_url) return;            // already has an avatar
    if (!isCommitteeMember(profile.role_id)) return; // non-committee

    let cancelled = false;

    (async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (cancelled) return;
        const googleUrl =
          session?.user?.user_metadata?.avatar_url ??
          session?.user?.user_metadata?.picture ??
          null;
        if (!googleUrl || cancelled) return;

        await supabase
          .from('profiles')
          .update({ avatar_url: googleUrl })
          .eq('id', profile.id);

        // Refresh the in-memory profile so every component sees the new avatar.
        // Merge just avatar_url — re-read the current profile to avoid
        // overwriting any concurrent field changes (name, role, etc.).
        const current = useAuthStore.getState().profile;
        if (current) useAuthStore.getState().setProfile({ ...current, avatar_url: googleUrl });
      } catch (err) {
        console.warn('Google avatar sync failed:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [profileRoleId]);

  return <>{children}</>;
}