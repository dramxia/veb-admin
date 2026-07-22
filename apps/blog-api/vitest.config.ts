import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@veb/api-contracts': fileURLToPath(
        new URL('../../packages/api-contracts/src/index.ts', import.meta.url),
      ),
      '@veb/service-auth': fileURLToPath(
        new URL('../../packages/service-auth/src/index.ts', import.meta.url),
      ),
    },
  },
});
