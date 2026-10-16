'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://uvilejtfmjykahnkujcm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aWxlanRmbWp5a2Fobmt1amNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1ODE3MjgsImV4cCI6MjEwMTE1NzcyOH0.76TVV52Kkk4FszDgvK2IWYV896dgOYZ2HNz8gpAVOBo';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl ?? 'https://placeholder.supabase.co', supabaseAnonKey ?? 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export function storageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/${path}`;
}

export function storageThumb(path: string, width = 800): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${storageUrl(path)}?width=${width}`;
}
