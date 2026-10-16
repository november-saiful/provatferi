// One-time backfill: re-crop/re-size every existing profile avatar to a
// 250×250 white-filled JPEG (matching `cropAvatar` in lib/upload.ts) and
// re-upload it, update `profiles.avatar_url`, then delete the old object.
//
// Reclaims the storage consumed by the old 512px aspect-preserving uploads —
// a 250px JPEG is typically just a few KB vs. hundreds of KB before.
//
// Usage:
//   npm run recompress:avatars            # real run (deletes old files)
//   npm run recompress:avatars -- --dry-run   # preview only, no changes
//
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local (service
// role bypasses RLS so every avatar is reachable regardless of role).

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal .env / .env.local loader (no extra dependency) — same as seed-users.mjs
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

const SUPABASE_URL = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const TARGET_SIZE = 250;
const JPEG_QUALITY = 85;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function publicUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/profiles/${path}`;
}

/** Lists every file under `avatars/` (including uid subfolders), paginated. */
async function listAvatarFiles() {
  const files = [];
  const MAX = 100; // storage list API limit

  // Walk one level at a time: `avatars` → `avatars/<uid>` → files
  async function walk(prefix, depth = 0) {
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage
        .from('profiles')
        .list(prefix, { limit: MAX, offset, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const entry of data) {
        const full = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.id === null) {
          // Folder — recurse (avatars/<uid>)
          if (depth < 2) await walk(full, depth + 1);
        } else if (full.startsWith('avatars/')) {
          files.push(full);
        }
      }
      offset += data.length;
      if (data.length < MAX) break;
    }
  }

  await walk('');
  return files;
}

/** True if the buffer is already a 250×250 JPEG (skip re-processing). */
async function alreadyOptimal(buffer) {
  try {
    const meta = await sharp(buffer).metadata();
    return meta.width === TARGET_SIZE && meta.height === TARGET_SIZE && meta.format === 'jpeg';
  } catch {
    return false;
  }
}

/** Center-crop to a square, white-fill (JPEG has no alpha), resize to 250. */
async function recompress(buffer) {
  return sharp(buffer)
    .rotate() // honor EXIF orientation, like the browser does
    .flatten({ background: '#ffffff' })
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

async function main() {
  console.log(`${DRY_RUN ? '[DRY RUN — no changes will be made]' : 'Recompressing avatars...'}\n`);
  const files = await listAvatarFiles();
  console.log(`Found ${files.length} avatar(s).\n`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  for (const path of files) {
    const parts = path.split('/');
    const uid = parts.length >= 3 ? parts[1] : null;
    if (!uid) {
      // Only ever expect `avatars/<uid>/<file>` — skip anything else so a stray
      // file can't be mistaken for a user id (which would orphan a new upload).
      console.warn(`  ! skip (unexpected path) ${path}`);
      continue;
    }

    let oldBytes = 0;
    let blob;
    try {
      const { data, error } = await supabase.storage.from('profiles').download(path);
      if (error) throw error;
      blob = data;
      oldBytes = blob.size;
      bytesBefore += oldBytes;
    } catch (err) {
      console.error(`  ! download failed  ${path}: ${err.message}`);
      failed++;
      continue;
    }

    const buffer = Buffer.from(await blob.arrayBuffer());

    let newBuffer;
    try {
      if (await alreadyOptimal(buffer)) {
        console.log(`  -  skip (already 250px) ${path}`);
        // Keep the totals comparable — skipped files change size by ~0, so count
        // them in both before and after.
        bytesAfter += oldBytes;
        skipped++;
        continue;
      }
      newBuffer = await recompress(buffer);
    } catch (err) {
      console.error(`  ! process failed    ${path}: ${err.message}`);
      failed++;
      continue;
    }

    bytesAfter += newBuffer.length;
    const saved = oldBytes - newBuffer.length;
    console.log(
      `  ~  ${path}  ${(oldBytes / 1024).toFixed(1)}KB → ${(newBuffer.length / 1024).toFixed(1)}KB (${saved > 0 ? '-' : '+'}${(Math.abs(saved) / 1024).toFixed(1)}KB)`
    );

    if (DRY_RUN) {
      processed++;
      continue;
    }

    try {
      const newName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-avatar.jpg`;
      const newPath = `avatars/${uid}/${newName}`;

      // 1. Upload the new small file (plain insert — never upsert).
      const { error: upErr } = await supabase.storage
        .from('profiles')
        .upload(newPath, newBuffer, { contentType: 'image/jpeg', cacheControl: '3600' });
      if (upErr) throw upErr;

      // 2. Point the profile at the new URL (owner is the uid folder segment).
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl(newPath) })
        .eq('id', uid);
      if (dbErr) {
        // Roll back the orphaned upload so a failed run doesn't leak files.
        // Keep dbErr as the reported cause even if the cleanup remove fails.
        try {
          await supabase.storage.from('profiles').remove([newPath]);
        } catch {
          console.error(`    (cleanup of ${newPath} also failed)`);
        }
        throw dbErr;
      }

      // 3. Delete the old file to reclaim storage.
      const { error: delErr } = await supabase.storage.from('profiles').remove([path]);
      if (delErr) throw delErr;

      processed++;
    } catch (err) {
      console.error(`  ! write failed      ${path}: ${err.message}`);
      failed++;
    }
  }

  const totalBefore = bytesBefore / 1024;
  const totalAfter = bytesAfter / 1024;
  const reclaimed = (bytesBefore - bytesAfter) / 1024;

  console.log(`\nDone.`);
  console.log(`  processed: ${processed}   skipped: ${skipped}   failed: ${failed}`);
  console.log(`  total: ${totalBefore.toFixed(1)}KB → ${totalAfter.toFixed(1)}KB  (reclaims ${Math.max(reclaimed, 0).toFixed(1)}KB)`);

  if (DRY_RUN) {
    console.log('\nThis was a dry run — nothing was uploaded, updated, or deleted.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
