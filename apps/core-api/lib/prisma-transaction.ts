import { Prisma } from '@/generated/client';
import { isPrismaSerializableConflict } from '@/lib/api-kit';
import { prisma } from './prisma';

const SERIALIZABLE_TRANSACTION_ATTEMPTS = 3;

export async function withSerializableRetry<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        !isPrismaSerializableConflict(error) ||
        attempt >= SERIALIZABLE_TRANSACTION_ATTEMPTS
      ) {
        throw error;
      }
    }
  }
}
