// Builds the counter and owner apps one after the other into dist/counter and dist/owner.
// Usage: node scripts/build.mjs [counter|owner]   (no argument builds both)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const apps = process.argv.slice(2);
const targets = apps.length > 0 ? apps : ['counter', 'owner'];

for (const app of targets) {
  if (app !== 'counter' && app !== 'owner') {
    console.error(`Unknown app "${app}". Use counter or owner.`);
    process.exit(1);
  }
  process.env.STOCKERS_APP = app;
  console.log(`\nBuilding ${app} app...`);
  await build({ root, configFile: path.join(root, 'vite.config.ts') });
}
