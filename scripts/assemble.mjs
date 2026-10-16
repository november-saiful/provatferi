import { rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dashOut = join(root, 'apps/dashboard/out');
const recOut = join(root, 'apps/recruitment/out');
const dist = join(root, 'dist');

for (const p of [dashOut, recOut]) {
  if (!existsSync(p)) {
    console.error(`Missing build output: ${p}`);
    console.error('Run the app builds first (npm run build:dashboard / build:recruitment).');
    process.exit(1);
  }
}

// Dashboard owns the site root.
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(dashOut, dist, { recursive: true });

// Recruitment lives under /recruitment. Both apps emit hashed files under
// _next/, so the trees merge; only index.html + logo are placed explicitly
// to avoid clobbering the dashboard's root files (/logo.png differs).
mkdirSync(join(dist, 'recruitment'), { recursive: true });
cpSync(join(recOut, 'index.html'), join(dist, 'recruitment/index.html'));
if (existsSync(join(recOut, '_next'))) {
  cpSync(join(recOut, '_next'), join(dist, '_next'), { recursive: true });
}
cpSync(
  join(root, 'apps/recruitment/public/logo.png'),
  join(dist, 'recruitment-logo.png')
);

console.log('Assembled dist/ (dashboard at /, recruitment at /recruitment).');
