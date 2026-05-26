import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/__tests__/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['lib/permission.ts', 'lib/menu.ts', 'lib/rate-limit.ts'],
    },
  },
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname,
    },
  },
});
