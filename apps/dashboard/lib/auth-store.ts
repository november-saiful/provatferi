'use client';

import { create } from 'zustand';
import { supabase } from './supabase/client';
import type { Profile, RoleId } from './types';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: RoleId | null;
  loading: boolean;
  setUser: (user: AuthState['user']) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  role: null,
  loading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile, role: profile?.role_id ?? null }),
  setLoading: (loading) => set({ loading }),

  refreshProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ user: null, profile: null, role: null });
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    set({ user: { id: user.id, email: user.email ?? '' }, profile: data ?? null, role: data?.role_id ?? null });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, role: null });
  }
}));
