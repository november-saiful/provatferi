// Verify the in-app notification system end-to-end against a live Supabase
// project (requires migrations 00016 + 00017 applied).
//
// Flows covered (spec §7.1):
//   A. Record edited   → tr1's expense edited by rds → creator gets record_edited
//   B. Record deleted  → same expense deleted by rds → creator gets record_deleted
//   C. Sponsor inquiry → anon submits sponsor        → pr/vp/gs/tr get sponsor_inquiry
//   D. Donation        → anon submits donation       → tr/pr/vp get donation
//   E. Role changed    → pr changes a user's role    → affected user gets role_changed
//   F. Event comment   → ofs creates event, alm comments → ofs gets event_comment
// Realtime (spec §7.2):
//   G. notification INSERT delivered over realtime without polling
//   H. notices INSERT delivered over realtime without polling
//
// Usage: node scripts/verify-notifications.mjs
// Needs .env.local with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// NEXT_PUBLIC_SUPABASE_ANON_KEY.
//
// Creates dedicated `nt-*@provatferi.test` users if missing. Test content rows
// and the notifications they generate are cleaned up afterwards; the audit
// trail (records_log) and the test users themselves are intentionally kept.

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const [, key, raw] = m;
    out[key] = raw.replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = {
  ...process.env,
  ...loadEnv(join(__dirname, '..', '.env')),
  ...loadEnv(join(__dirname, '..', '.env.local'))
};

const SUPABASE_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = 'Provatferi@2026';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const testStart = new Date().toISOString();
let passed = 0;
let failed = 0;
const createdIds = { notifications: [], sponsors: [], donations: [], expenses: [], events: [], comments: [], notices: [] };

function ok(label) {
  passed++;
  console.log(`  ✅ ${label}`);
}
function fail(label, detail) {
  failed++;
  console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
}

async function ensureUser(email, roleId, fullName) {
  const { data: existing } = await admin
    .from('profiles')
    .select('id, role_id')
    .eq('email', email)
    .limit(1)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });
  if (error) throw new Error(`create ${email}: ${error.message}`);
  const { error: upErr } = await admin
    .from('profiles')
    .update({ role_id: roleId, full_name: fullName, is_active: true })
    .eq('id', data.user.id);
  if (upErr) throw new Error(`profile ${email}: ${upErr.message}`);
  console.log(`  + created test user ${email} (${roleId})`);
  return { id: data.user.id, role_id: roleId };
}

async function signIn(email) {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`signin ${email}: ${error.message}`);
  return client;
}

async function getNotifications(userId, type) {
  const { data, error } = await admin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', testStart)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Subscribe to a realtime channel; resolves when an INSERT event matches `filter`.
function waitForRealtime(client, channelName, table, filter, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeChannel(channel);
      reject(new Error(`realtime timeout on ${table}`));
    }, timeoutMs);
    const channel = client.channel(channelName);
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter }, (payload) => {
        clearTimeout(timer);
        client.removeChannel(channel);
        resolve(payload);
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timer);
          reject(new Error(`subscribe failed: ${status}`));
        }
      });
  });
}

async function main() {
  console.log(`\n=== Verify in-app notifications (started ${testStart}) ===\n`);

  // 1. Test users (dedicated, do not touch seeded members)
  console.log('Setting up test users…');
  const creator = await ensureUser('nt-creator@provatferi.test', 'tr', 'Notify Creator');
  const editor = await ensureUser('nt-editor@provatferi.test', 'rds', 'Notify Editor');
  const president = await ensureUser('nt-president@provatferi.test', 'pr', 'Notify President');
  const gs = await ensureUser('nt-gs@provatferi.test', 'gs', 'Notify GS');
  const vp = await ensureUser('nt-vp@provatferi.test', 'vp', 'Notify VP');
  const ofs = await ensureUser('nt-ofs@provatferi.test', 'ofs', 'Notify OFS');
  const alumni = await ensureUser('nt-alm@provatferi.test', 'alm', 'Notify Alumni');
  const target = await ensureUser('nt-target@provatferi.test', 'alm', 'Notify Target');

  // ── A + B: record edited / deleted → original creator ─────────────────────
  console.log('\nA/B — record edited + deleted → creator…');
  const creatorClient = await signIn('nt-creator@provatferi.test');
  const { data: expense, error: expErr } = await creatorClient
    .from('expenses')
    .insert({ title: `[verify] expense ${Date.now()}`, amount: 1234, category: 'বিবিধ', expense_date: '2026-08-01' })
    .select('id')
    .single();
  if (expErr) {
    fail('create expense as tr', expErr.message);
  } else {
    createdIds.expenses.push(expense.id);
    const editorClient = await signIn('nt-editor@provatferi.test');
    const { error: updErr } = await editorClient
      .from('expenses')
      .update({ title: `[verify] expense edited ${Date.now()}` })
      .eq('id', expense.id);
    if (updErr) {
      fail('edit expense as rds', updErr.message);
    } else {
      const notes = await getNotifications(creator.id, 'record_edited');
      notes.length > 0 ? ok('record_edited → creator') : fail('record_edited → creator', 'no notification');
    }

    const { error: delErr } = await editorClient.from('expenses').delete().eq('id', expense.id);
    if (delErr) {
      fail('delete expense as rds', delErr.message);
    } else {
      const notes = await getNotifications(creator.id, 'record_deleted');
      notes.length > 0 ? ok('record_deleted → creator') : fail('record_deleted → creator', 'no notification');
    }
  }

  // ── C: sponsor inquiry → pr/vp/gs/tr ──────────────────────────────────────
  console.log('\nC — sponsor inquiry → pr/vp/gs/tr…');
  const { data: sponsor, error: spErr } = await anon
    .from('sponsors')
    .insert({ company_name: `Verify Corp ${Date.now()}`, contact_email: 'verify@test.dev' })
    .select('id')
    .single();
  if (spErr) {
    fail('submit sponsor as anon', spErr.message);
  } else {
    createdIds.sponsors.push(sponsor.id);
    for (const [user, label] of [
      [president, 'pr'],
      [vp, 'vp'],
      [gs, 'gs'],
      [creator, 'tr']
    ]) {
      const notes = await getNotifications(user.id, 'sponsor_inquiry');
      notes.length > 0 ? ok(`sponsor_inquiry → ${label}`) : fail(`sponsor_inquiry → ${label}`, 'no notification');
    }
  }

  // ── D: donation → tr/pr/vp ────────────────────────────────────────────────
  console.log('\nD — donation → tr/pr/vp…');
  const { data: donation, error: dnErr } = await anon
    .from('donations')
    .insert({ donor_name: `Verify Donor ${Date.now()}`, amount: 500, show_on_board: false })
    .select('id')
    .single();
  if (dnErr) {
    fail('submit donation as anon', dnErr.message);
  } else {
    createdIds.donations.push(donation.id);
    for (const [user, label] of [
      [creator, 'tr'],
      [president, 'pr'],
      [vp, 'vp']
    ]) {
      const notes = await getNotifications(user.id, 'donation');
      notes.length > 0 ? ok(`donation → ${label}`) : fail(`donation → ${label}`, 'no notification');
    }
  }

  // ── E: role changed → affected user ───────────────────────────────────────
  console.log('\nE — role changed → affected user…');
  const presidentClient = await signIn('nt-president@provatferi.test');
  const { error: roleErr } = await presidentClient.from('profiles').update({ role_id: 'cs' }).eq('id', target.id);
  if (roleErr) {
    fail('change role as pr', roleErr.message);
  } else {
    const notes = await getNotifications(target.id, 'role_changed');
    notes.length > 0 ? ok('role_changed → affected user') : fail('role_changed → affected user', 'no notification');
    // Revert the role change so the test user stays consistent.
    await presidentClient.from('profiles').update({ role_id: 'alm' }).eq('id', target.id);
  }

  // ── F: comment on your event → event creator ──────────────────────────────
  console.log('\nF — comment on your event → event creator…');
  const ofsClient = await signIn('nt-ofs@provatferi.test');
  const { data: event, error: evErr } = await ofsClient
    .from('events')
    .insert({ title: `[verify] event ${Date.now()}`, status: 'upcoming', event_date: new Date().toISOString() })
    .select('id')
    .single();
  if (evErr) {
    fail('create event as ofs', evErr.message);
  } else {
    createdIds.events.push(event.id);
    const alumniClient = await signIn('nt-alm@provatferi.test');
    const { data: comment, error: cmErr } = await alumniClient
      .from('event_comments')
      .insert({ event_id: event.id, content: '[verify] comment', user_id: alumni.id })
      .select('id')
      .single();
    if (cmErr) {
      fail('comment as alm', cmErr.message);
    } else {
      createdIds.comments.push(comment.id);
      const notes = await getNotifications(ofs.id, 'event_comment');
      notes.length > 0 ? ok('event_comment → event creator') : fail('event_comment → event creator', 'no notification');
    }
  }

  // ── G: realtime delivery of a notification (no refresh) ───────────────────
  console.log('\nG — realtime: notification INSERT delivered without polling…');
  try {
    const rt = await waitForRealtime(creatorClient, `verify-nt-${Date.now()}`, 'notifications', `user_id=eq.${creator.id}`);
    // Fire a second sponsor submission from the anon client (creator is tr → recipient).
    const { data: sp2, error: sp2Err } = await anon
      .from('sponsors')
      .insert({ company_name: `Realtime Corp ${Date.now()}`, contact_email: 'rt@test.dev' })
      .select('id')
      .single();
    if (sp2Err) throw new Error(`sponsor insert: ${sp2Err.message}`);
    createdIds.sponsors.push(sp2.id);
    await rt;
    ok('realtime notification INSERT received (no refresh required)');
  } catch (err) {
    fail('realtime notification INSERT received', err.message);
  }

  // ── H: realtime for a public table (notices, spec §7.2) ───────────────────
  console.log('\nH — realtime: new notice appears without refresh…');
  try {
    const rt = await waitForRealtime(ofsClient, `verify-ntb-${Date.now()}`, 'notices', '');
    const { data: notice, error: nbErr } = await ofsClient
      .from('notices')
      .insert({ title: `[verify] notice ${Date.now()}`, content: 'realtime check', is_public: true })
      .select('id')
      .single();
    if (nbErr) throw new Error(`notice insert: ${nbErr.message}`);
    createdIds.notices.push(notice.id);
    await rt;
    ok('realtime notices INSERT received (no refresh required)');
  } catch (err) {
    fail('realtime notices INSERT received', err.message);
  }

  // ── Cleanup: test content rows + their notifications ──────────────────────
  console.log('\nCleanup…');
  const { data: testNotes } = await admin
    .from('notifications')
    .select('id')
    .gte('created_at', testStart);
  const noteIds = (testNotes ?? []).map((n) => n.id);
  if (noteIds.length) await admin.from('notifications').delete().in('id', noteIds);
  if (createdIds.comments.length) await admin.from('event_comments').delete().in('id', createdIds.comments);
  if (createdIds.events.length) await admin.from('events').delete().in('id', createdIds.events);
  if (createdIds.sponsors.length) await admin.from('sponsors').delete().in('id', createdIds.sponsors);
  if (createdIds.donations.length) await admin.from('donations').delete().in('id', createdIds.donations);
  if (createdIds.expenses.length) await admin.from('expenses').delete().in('id', createdIds.expenses);
  if (createdIds.notices.length) await admin.from('notices').delete().in('id', createdIds.notices);
  console.log(`  removed ${noteIds.length} test notifications + ${createdIds.expenses.length + createdIds.sponsors.length + createdIds.donations.length + createdIds.events.length + createdIds.comments.length + createdIds.notices.length} test content rows`);

  console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
