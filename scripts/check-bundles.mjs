// Run after `npm run build`. Fails if the counter bundle contains anything that points to the owner
// app. Usage: node scripts/check-bundles.mjs [folder]   (default: apps/web/dist/counter)
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const FORBIDDEN = ['owner-', '/api/owner', 'owner.html'];
const TEXT_FILES = /\.(js|mjs|css|html|json|map|svg|txt|webmanifest|xml)$/i;

const folder = path.resolve(process.argv[2] ?? 'apps/web/dist/counter');

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let files;
try {
  files = [];
  for await (const file of walk(folder)) files.push(file);
} catch {
  console.error(`Cannot read ${folder}. Run "npm run build" first.`);
  process.exit(1);
}

const problems = [];
for (const file of files) {
  const relative = path.relative(folder, file);
  for (const needle of FORBIDDEN) {
    if (relative.includes(needle)) problems.push(`${relative}: file name contains "${needle}"`);
  }
  if (!TEXT_FILES.test(file)) continue;
  const text = await readFile(file, 'utf-8');
  for (const needle of FORBIDDEN) {
    if (text.includes(needle)) problems.push(`${relative}: contains "${needle}"`);
  }
}

if (problems.length > 0) {
  console.error(`Bundle check FAILED for ${folder}`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`Bundle check passed: ${files.length} files in ${folder} have no owner code.`);
