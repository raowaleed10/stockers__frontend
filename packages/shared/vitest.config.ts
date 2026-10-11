import { defineConfig } from 'vitest/config';

// An explicit config also stops Vitest from searching parent folders for a vite.config.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
