import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  test: {
    environment: 'node',
    include: ['lib/__tests__/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['lib/date-time.ts', 'lib/markdown.ts', 'lib/safe-redirect.ts'],
    },
  },
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname,
    },
  },
});
