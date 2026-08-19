import { isPrismaKnownRequestError } from '@veb/api-kit';
import { ServiceAuthError, type ServiceRequestClaims } from '@veb/service-auth';
import { prisma } from '@/lib/prisma';

const replaySafeMethods = new Set(['GET', 'HEAD']);
const replayRetentionSeconds = 60;

export async function consumeServiceToken(
  claims: ServiceRequestClaims,
  now = new Date(),
) {
  if (replaySafeMethods.has(claims.method)) return;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.serviceTokenReplay.deleteMany({
        where: { expiresAt: { lte: now } },
      });
      await tx.serviceTokenReplay.create({
        data: {
          issuer: claims.issuer,
          tokenId: claims.tokenId,
          expiresAt: new Date(
            (claims.expiresAt + replayRetentionSeconds) * 1000,
          ),
        },
      });
    });
  } catch (error) {
    if (isPrismaKnownRequestError(error, 'P2002')) {
      throw new ServiceAuthError('INVALID_TOKEN', '服务令牌已被使用');
    }
    throw error;
  }
}
