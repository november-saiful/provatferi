// Supabase Edge Function: ban / unban / delete a user from the admin panel.
//
// Deleting an auth user requires the service role, so it cannot run from the
// browser with the anon key. This function validates that the caller is an
// admin (root / pr / vp / admin) using their JWT before mutating anything.
//
// Authorization header = the caller's anon-key bearer token (sent automatically
// by supabase.functions.invoke).
//
// Secrets required:
//   SUPABASE_URL  (bound automatically)
//   SUPABASE_SERVICE_ROLE_KEY (bound automatically)

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Identify the caller and verify they hold an admin role
  const {
    data: { user: caller },
    error: authError
  } = await supabase.auth.getUser(token);

  if (authError || !caller) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', caller.id)
    .maybeSingle();

  if (!callerProfile || !['pr', 'vp', 'admin', 'root'].includes(callerProfile.role_id)) {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403, headers: corsHeaders });
  }

  const { action, userId } = await req.json().catch(() => ({}));

  if (!['ban', 'unban', 'delete'].includes(action) || typeof userId !== 'string' || !userId) {
    return new Response(JSON.stringify({ error: 'Invalid action or userId' }), { status: 400, headers: corsHeaders });
  }

  if (userId === caller.id) {
    return new Response(JSON.stringify({ error: 'আপনি নিজেকে এই কাজটি করতে পারবেন না' }), { status: 400, headers: corsHeaders });
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', userId)
    .maybeSingle();

  if (!target) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: corsHeaders });
  }

  // Root user cannot be modified by anyone
  if (target.role_id === 'root') {
    return new Response(JSON.stringify({ error: 'রুট ব্যবহারকারীকে পরিবর্তন বা মুছে ফেলা যাবে না।' }), { status: 403, headers: corsHeaders });
  }

  // Only root can delete president; non-root admins cannot
  if (target.role_id === 'pr' && callerProfile.role_id !== 'root') {
    return new Response(JSON.stringify({ error: 'সভাপতির অ্যাকাউন্ট পরিবর্তন করা যাবে না' }), { status: 403, headers: corsHeaders });
  }

  if (action === 'delete') {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ ok: true, action, userId }), { headers: corsHeaders });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: action === 'ban' ? false : true })
    .eq('id', userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true, action, userId }), { headers: corsHeaders });
});
