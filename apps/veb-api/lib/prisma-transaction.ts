import { Prisma } from '@/generated/client';
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
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034';
      if (!retryable || attempt >= SERIALIZABLE_TRANSACTION_ATTEMPTS) {
        throw error;
      }
    }
  }
}
