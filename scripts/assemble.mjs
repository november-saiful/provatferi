import { rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dashOut = join(root, 'apps/dashboard/out');
const dist = join(root, 'dist');

if (!existsSync(dashOut)) {
  console.error(`Missing build output: ${dashOut}`);
  console.error('Run the app build first (npm run build:dashboard).');
  process.exit(1);
}

// The dashboard owns the whole site, including /recruitment/.
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(dashOut, dist, { recursive: true });

console.log('Assembled dist/ (dashboard at /, recruitment at /recruitment/).');
