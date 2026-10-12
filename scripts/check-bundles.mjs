// Run after `npm run build`. Fails if the counter bundle contains anything that points to the owner
// app: owner paths, or any owner text (a value in apps/web/src/owner/locales longer than 10
// characters). Dev-only words (src/dev/locales) must not appear in either bundle.
// Usage: node scripts/check-bundles.mjs [folder]   (default: apps/web/dist/counter)
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FORBIDDEN = ['owner-', '/api/owner', 'owner.html'];
const TEXT_FILES = /\.(js|mjs|css|html|json|map|svg|txt|webmanifest|xml)$/i;
const MIN_TEXT_LENGTH = 10; // only strings longer than this count as "owner text"

const root = fileURLToPath(new URL('..', import.meta.url));
const explicitFolder = process.argv[2];
const folder = path.resolve(explicitFolder ?? 'apps/web/dist/counter');
const ownerFolder = path.resolve('apps/web/dist/owner');
const OWNER_LOCALES = path.join(root, 'apps/web/src/owner/locales');
const DEV_LOCALES = path.join(root, 'apps/web/src/dev/locales');
const COMMON_LOCALES = path.join(root, 'apps/web/src/locales');
const COUNTER_LOCALES = path.join(root, 'apps/web/src/counter/locales');

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function listFiles(dir) {
  const files = [];
  for await (const file of walk(dir)) files.push(file);
  return files;
}

/** Every string longer than the limit in the language files under `dir`, with its file and key. */
async function readTexts(dir) {
  const texts = [];
  const collect = (value, keyPath, file) => {
    if (typeof value === 'string') {
      if ([...value].length > MIN_TEXT_LENGTH)
        texts.push({ text: value, key: keyPath.join('.'), file });
    } else if (value && typeof value === 'object') {
      for (const [key, inner] of Object.entries(value)) collect(inner, [...keyPath, key], file);
    }
  };
  for (const file of await listFiles(dir)) {
    if (!file.endsWith('.json')) continue;
    const relative = path.relative(root, file).split(path.sep).join('/');
    collect(JSON.parse(await readFile(file, 'utf-8')), [], relative);
  }
  return texts;
}

/**
 * A bundler writes a string inside quotes and escapes it, and may write non-ASCII as \uXXXX. Return
 * the spellings one string can take in a built file, so none gets past the check.
 */
function spellings(text) {
  const escapeFor = (value, quote) =>
    value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .split(quote)
      .join(`\\${quote}`);
  const asciiOnly = (value) =>
    value.replace(/[^\x00-\x7f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

  const forms = new Set();
  for (const quote of ['"', "'", '`']) {
    const once = escapeFor(text, quote);
    const twice = escapeFor(once, quote); // JSON text inside JSON.parse("...")
    for (const form of [once, twice]) {
      forms.add(form);
      forms.add(asciiOnly(form));
    }
  }
  forms.add(text);
  return [...forms];
}

async function readBundle(dir) {
  const files = await listFiles(dir);
  const texts = new Map();
  for (const file of files) {
    if (TEXT_FILES.test(file)) texts.set(file, await readFile(file, 'utf-8'));
  }
  return { files, texts };
}

const preview = (text) => (text.length > 40 ? `${text.slice(0, 40)}...` : text);

/** Which of `owned` appear in the bundle? Returns one message per hit. */
function findTexts(bundle, dir, owned, label) {
  const found = [];
  for (const item of owned) {
    const forms = spellings(item.text);
    for (const [file, content] of bundle.texts) {
      if (forms.some((form) => content.includes(form))) {
        found.push(
          `${path.relative(dir, file)}: contains ${label} "${preview(item.text)}" (${item.file}, ${item.key})`,
        );
        break; // one report per string is enough
      }
    }
  }
  return found;
}

let bundle;
try {
  bundle = await readBundle(folder);
} catch {
  console.error(`Cannot read ${folder}. Run "npm run build" first.`);
  process.exit(1);
}

let ownerTexts;
try {
  ownerTexts = await readTexts(OWNER_LOCALES);
} catch {
  console.error(`Cannot read ${OWNER_LOCALES}. The owner language files folder must exist.`);
  process.exit(1);
}
let devTexts = [];
let devSharedCount = 0;
try {
  const dev = await readTexts(DEV_LOCALES);
  // A dev sample that is word for word a real shipped text (a common word, say) is not dev-only text:
  // finding it in a bundle proves nothing. Owner text is never excused like this.
  const shipped = new Set();
  for (const dir of [COMMON_LOCALES, COUNTER_LOCALES]) {
    try {
      for (const item of await readTexts(dir)) shipped.add(item.text);
    } catch {
      // folder missing: nothing shipped from there
    }
  }
  devTexts = dev.filter((item) => !shipped.has(item.text));
  devSharedCount = dev.length - devTexts.length;
} catch {
  // no dev language files yet
}

// The mock server's seed (mock/seed.json) is demo data. A production build has no mock server, so none of
// its players, phone numbers or its example private address may be in either bundle. (A build made with
// VITE_MOCKS=on does ship the seed, so it fails this check: it is a demo build, never a release.)
const SEED_FILE = path.join(root, 'mock/seed.json');
let seedTexts = [];
try {
  const seed = JSON.parse(await readFile(SEED_FILE, 'utf-8'));
  const own = (text, key) => ({ text, file: 'mock/seed.json', key });
  seedTexts = [
    ...seed.players.flatMap((player, i) => [
      own(player.name, `players[${i}].name`),
      ...(player.phone ? [own(player.phone, `players[${i}].phone`)] : []),
    ]),
    own(seed.meta.ownerPathExample, 'meta.ownerPathExample'),
  ];
} catch {
  // no seed file: nothing to look for
}

const problems = [];
for (const file of bundle.files) {
  const relative = path.relative(folder, file);
  for (const needle of FORBIDDEN) {
    if (relative.includes(needle)) problems.push(`${relative}: file name contains "${needle}"`);
  }
}
for (const [file, text] of bundle.texts) {
  const relative = path.relative(folder, file);
  for (const needle of FORBIDDEN) {
    if (text.includes(needle)) problems.push(`${relative}: contains "${needle}"`);
  }
}
problems.push(...findTexts(bundle, folder, ownerTexts, 'owner text'));
problems.push(...findTexts(bundle, folder, devTexts, 'dev-only text'));
problems.push(...findTexts(bundle, folder, seedTexts, 'mock seed data'));

// Dev-only words and seed data must not ship in the owner bundle either (checked on a default run when it is built).
let ownerBundleChecked = false;
if (explicitFolder === undefined && (devTexts.length > 0 || seedTexts.length > 0)) {
  try {
    const built = await readBundle(ownerFolder);
    ownerBundleChecked = true;
    problems.push(...findTexts(built, ownerFolder, devTexts, 'dev-only text'));
    problems.push(...findTexts(built, ownerFolder, seedTexts, 'mock seed data'));
  } catch {
    // the owner bundle is not built; nothing to check
  }
}

if (problems.length > 0) {
  console.error(`Bundle check FAILED for ${folder}`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

const ownerNote =
  ownerTexts.length === 0
    ? 'no owner strings yet'
    : `${ownerTexts.length} owner strings searched for`;
console.log(
  `Bundle check passed: ${bundle.files.length} files in ${folder} have no owner code (${ownerNote}` +
    `${devTexts.length > 0 ? `; ${devTexts.length} dev-only strings${ownerBundleChecked ? ' also checked in the owner bundle' : ''}${devSharedCount > 0 ? `, ${devSharedCount} skipped because they are also real shipped words` : ''}` : ''}` +
    `${seedTexts.length > 0 ? `; ${seedTexts.length} mock seed strings searched for` : ''}).`,
);
