'use client';

import { supabase } from './supabase/client';

export type UserAdminAction = 'ban' | 'unban' | 'delete';

/**
 * Calls the `user-admin` Supabase Edge Function. The edge function validates
 * that the caller is pr / vp / admin (via their JWT) before acting, which is
 * required because deleting an auth user needs the service role.
 */
export async function invokeUserAdmin(action: UserAdminAction, userId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('user-admin', {
    body: { action, userId }
  });
  if (error) throw new Error(error.message ?? 'অপারেশন ব্যর্থ হয়েছে');
  if (data && !data.ok) throw new Error(data.error ?? 'অপারেশন ব্যর্থ হয়েছে');
}