import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { devEntries } from './vite/dev-entries';

const root = fileURLToPath(new URL('.', import.meta.url));

/**
 * `npm run dev` serves both apps from one server (counter at `/`, owner at `/owner-dev/`).
 * `npm run build` runs this config once per app (scripts/build.mjs sets STOCKERS_APP), so each
 * bundle is built on its own and owner code can never end up in a counter chunk.
 */
export default defineConfig(({ command, mode }) => {
  const app = process.env.STOCKERS_APP;
  if (command === 'build' && app !== 'counter' && app !== 'owner') {
    throw new Error(
      'Build one app at a time: run `npm run build` (or build:counter / build:owner).',
    );
  }

  const env = loadEnv(mode, root, 'VITE_');
  // Mocks: on in dev unless VITE_MOCKS=off; in a build only when VITE_MOCKS=on.
  const mocks = command === 'serve' ? env.VITE_MOCKS !== 'off' : env.VITE_MOCKS === 'on';

  return {
    root,
    base: app === 'owner' ? './' : '/',
    plugins: [react(), devEntries()],
    resolve: { alias: { '@': path.resolve(root, 'src') } },
    define: { __MOCKS__: JSON.stringify(mocks) },
    server: { port: 5173, strictPort: true },
    build:
      command === 'build'
        ? {
            outDir: `dist/${app}`,
            emptyOutDir: true,
            rollupOptions: { input: path.resolve(root, `${app}.html`) },
          }
        : {},
  };
});
