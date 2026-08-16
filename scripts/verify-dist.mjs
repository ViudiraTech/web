import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const indexPath = path.join(dist, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html is missing. Run Vite build first.');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
if (/\b(?:src|href)=["']\/web\//i.test(html)) {
  console.error('Deployment regression: dist/index.html still contains hard-coded /web/ asset URLs.');
  process.exit(1);
}

const refs = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)].map((match) => match[1]);
const missing = [];

for (const ref of refs) {
  if (!ref || ref.startsWith('#') || /^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(ref)) continue;
  const clean = ref.split(/[?#]/, 1)[0];
  const resolved = clean.startsWith('/')
    ? path.join(dist, clean.replace(/^\/+/, ''))
    : path.resolve(path.dirname(indexPath), clean);
  if (!fs.existsSync(resolved)) missing.push(`${ref} -> ${path.relative(root, resolved)}`);
}

if (missing.length) {
  console.error('Built HTML references missing local files:');
  for (const item of missing) console.error(`  - ${item}`);
  process.exit(1);
}

console.log(`Build artifact verification passed (${refs.length} HTML asset/link references checked).`);
