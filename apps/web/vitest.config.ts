import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'src') } },
  define: { __MOCKS__: false },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    // Each file draws whole screens through jsdom, the router and the mock server. Seven at a time on an 8-core computer
    // slow one another down enough that a test meets its 5 s limit, so fewer run together (no retry, no longer limit).
    poolOptions: { forks: { maxForks: 4, minForks: 1 }, threads: { maxThreads: 4, minThreads: 1 } },
  },
});
