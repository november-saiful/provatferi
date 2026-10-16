// Seed test users (at least 2 per role) using the Supabase service-role key.
//
// Usage:
//   1. Create a .env.local file with:
//        SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
//        SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
//   2. npm run seed:users
//
// This creates auth users and sets their role_id + display_id in `profiles`.

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal .env / .env.local loader (no extra dependency)
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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 2 test users per role, 14 roles + visitors. Password satisfies a strong policy.
const PASSWORD = 'Provatferi@2026';

const ROLES = [
  ['pr', 'President'],
  ['vp', 'Vice President'],
  ['gs', 'General Secretary'],
  ['jgs', 'Joint General Secretary'],
  ['tr', 'Treasurer'],
  ['ofs', 'Office Secretary'],
  ['ors', 'Organizing Secretary'],
  ['cs', 'Cultural Secretary'],
  ['acs', 'Assistant Cultural Secretary'],
  ['pps', 'Publicity and Publication Secretary'],
  ['prs', 'Public Relations Secretary'],
  ['rds', 'Record and Documentation Secretary'],
  ['cc', 'Course Coordinator'],
  ['alm', 'Alumni']
];

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function upsertProfile(userId, roleId, displayId, fullName, email) {
  const { error } = await supabase
    .from('profiles')
    .update({ role_id: roleId, display_id: displayId, full_name: fullName, is_active: true })
    .eq('id', userId);

  if (error) {
    const { error: insertError } = await supabase.from('profiles').upsert({
      id: userId,
      role_id: roleId,
      display_id: displayId,
      full_name: fullName,
      email,
      is_active: true
    });
    if (insertError) {
      console.error(`  ! could not set profile for ${fullName}: ${insertError.message}`);
    }
  }
}

async function main() {
  console.log('Creating test users...\n');
  let total = 0;

  for (const [roleId, roleName] of ROLES) {
    for (const n of [1, 2]) {
      const displayId = n === 1 ? roleId : `${roleId}-0${n}`;
      const firstName = roleId.toUpperCase();
      const email = `${roleId}${n}@provatferi.test`;
      const fullName = `${firstName} ${n === 1 ? 'One' : 'Two'}`;

      const { data: existing, error: listErr } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      let userId = existing?.id ?? null;

      if (!userId) {
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: fullName }
        });
        if (error) {
          console.error(`  ! create ${email}: ${error.message}`);
          continue;
        }
        userId = data.user.id;
      }

      await upsertProfile(userId, roleId, displayId, fullName, email);
      console.log(`  ok  ${roleName.padEnd(45)} ${displayId.padEnd(10)} ${email}`);
      total++;
    }
  }

  // A couple of plain visitors for testing public flows
  for (const n of [1, 2]) {
    const email = `visitor${n}@provatferi.test`;
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    let userId = existing?.id ?? null;
    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: `Visitor ${n}` }
      });
      if (error) {
        console.error(`  ! create ${email}: ${error.message}`);
        continue;
      }
      userId = data.user.id;
    }
    await upsertProfile(userId, 'visitor', `visitor-0${n}`, `Visitor ${n}`, email);
    console.log(`  ok  ${'Visitor'.padEnd(45)} visitor-0${n}        ${email}`);
    total++;
  }

  console.log(`\nDone. ${total} test users created. Password for all: ${PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
