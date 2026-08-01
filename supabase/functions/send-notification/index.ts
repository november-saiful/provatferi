// Supabase Edge Function: sends an email when a record is modified/deleted.
// Triggered by a Database Webhook on `records_log` -> INSERT events.
//
// Secrets required:
//   RESEND_API_KEY
//   SITE_URL
//   SUPABASE_URL  (bound automatically)
//   SUPABASE_SERVICE_ROLE_KEY (bound automatically)

import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Webhook payload from Supabase Database Webhooks
  const { type, record, table } = await req.json().catch(() => ({}));

  // Only handle INSERTs on records_log
  if (type && type !== 'INSERT' && table !== 'records_log') {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const logEntry = record;
  if (!logEntry || !logEntry.id) {
    return new Response('No record', { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const originalCreator = logEntry.original_creator;
  if (!originalCreator) {
    return new Response('No original creator', { status: 200 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', originalCreator)
    .single();

  const recipientEmail = profile?.email;
  if (!recipientEmail) {
    return new Response('No email', { status: 200 });
  }

  const actionLabels: Record<string, string> = {
    update: 'modified',
    delete: 'deleted'
  };
  const action = actionLabels[logEntry.action] ?? 'changed';
  const tableName = (logEntry.table_name ?? 'record').replace(/_/g, ' ');
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://home.provatferi2009.workers.dev';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Provatferi <noreply@home.provatferi2009.workers.dev>',
      to: recipientEmail,
      subject: `Your ${tableName} record was ${action}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5d0bc; border-radius: 12px;">
          <h2 style="color: #6F4E37; margin-top: 0;">Provatferi</h2>
          <p>Hello${profile?.full_name ? ' ' + profile.full_name : ''},</p>
          <p>Your <strong>${tableName}</strong> record was <strong>${action}</strong>.</p>
          <p style="color: #6b6b6b; font-size: 14px;">${
            logEntry.modified_by ? `Modified by user id: ${logEntry.modified_by}` : ''
          }</p>
          <a href="${siteUrl}/dashboard/rcd" style="display: inline-block; margin-top: 12px; padding: 10px 18px; background: #6F4E37; color: #fff; border-radius: 8px; text-decoration: none;">View changes</a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">If you did not expect this change, please contact the committee.</p>
        </div>
      `
    })
  });

  if (!res.ok) {
    const body = await res.text();
    return new Response(`Resend error: ${res.status} ${body}`, { status: 502 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
