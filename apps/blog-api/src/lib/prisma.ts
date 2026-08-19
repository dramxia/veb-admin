import { PrismaClient } from '@/generated/prisma';
import { createPrismaSingleton } from '@veb/api-kit';

export const prisma = createPrismaSingleton(
  'blogPrisma',
  () =>
    new PrismaClient({
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    }),
);
