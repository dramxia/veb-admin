import { PrismaClient } from '@/generated/client';
import { createPrismaSingleton } from '@/lib/api-kit';

export const prisma = createPrismaSingleton(
  'prisma',
  () =>
    new PrismaClient({
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    }),
);
