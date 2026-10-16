// One-shot: generate installable PWA icons from public/logo.png.
// Run: node scripts/generate-pwa-icons.mjs
// Requires sharp (already a devDependency).
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const BG = '#faf7f3'; // app background — safe padding color for maskable icon

// Square icon: logo contained with padding so nothing is cropped by masks.
async function square(out, size, paddingPct) {
  const pad = Math.round((size * paddingPct) / 100);
  await sharp(join(pub, 'logo.png'))
    .resize(size - pad * 2, size - pad * 2, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG })
    .png()
    .toFile(join(pub, out));
  console.log('wrote', out);
}

await square('icon-192.png', 192, 10);
await square('icon-512.png', 512, 10);
await square('maskable-512.png', 512, 20);
