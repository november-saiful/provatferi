// Supabase Edge Function: ban / unban / delete a user from the admin panel.
//
// Deleting an auth user requires the service role, so it cannot run from the
// browser with the anon key. This function validates that the caller is an
// admin (pr / vp / admin) using their JWT before mutating anything.
//
// Authorization header = the caller's anon-key bearer token (sent automatically
// by supabase.functions.invoke).
//
// Secrets required:
//   SUPABASE_URL  (bound automatically)
//   SUPABASE_SERVICE_ROLE_KEY (bound automatically)

import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
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
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', caller.id)
    .maybeSingle();

  if (!callerProfile || !['pr', 'vp', 'admin'].includes(callerProfile.role_id)) {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
  }

  const { action, userId } = await req.json().catch(() => ({}));

  if (!['ban', 'unban', 'delete'].includes(action) || typeof userId !== 'string' || !userId) {
    return new Response(JSON.stringify({ error: 'Invalid action or userId' }), { status: 400 });
  }

  if (userId === caller.id) {
    return new Response(JSON.stringify({ error: 'আপনি নিজেকে এই কাজটি করতে পারবেন না' }), { status: 400 });
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', userId)
    .maybeSingle();

  if (!target) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  if (target.role_id === 'pr') {
    return new Response(JSON.stringify({ error: 'সভাপতির অ্যাকাউন্ট পরিবর্তন করা যাবে না' }), { status: 403 });
  }

  if (action === 'delete') {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ ok: true, action, userId }));
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: action === 'ban' ? false : true })
    .eq('id', userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true, action, userId }));
});
