import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const serviceTokenReplay = {
    create: vi.fn(),
    deleteMany: vi.fn(),
  };
  return {
    serviceTokenReplay,
    transaction: vi.fn(
      async (
        callback: (tx: {
          serviceTokenReplay: typeof serviceTokenReplay;
        }) => unknown,
      ) => callback({ serviceTokenReplay }),
    ),
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    serviceTokenReplay: mocks.serviceTokenReplay,
    $transaction: mocks.transaction,
  },
}));

const { consumeServiceToken } = await import('@/modules/service-auth/replay');

function claims(method = 'POST') {
  return {
    issuer: 'veb-api',
    subject: 'user-1',
    audience: 'blog-api',
    permission: 'content:article:create',
    method,
    path: '/api/internal/v1/articles',
    bodyHash: 'hash',
    requestId: 'request-1',
    issuedAt: 1_800_000_000,
    expiresAt: 1_800_000_060,
    tokenId: 'token-1',
  };
}

describe('service token replay protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.serviceTokenReplay.create.mockResolvedValue(undefined);
    mocks.serviceTokenReplay.deleteMany.mockResolvedValue({ count: 0 });
  });

  it('atomically consumes a write token and removes expired records', async () => {
    const now = new Date('2027-01-15T08:00:00.000Z');

    await expect(consumeServiceToken(claims(), now)).resolves.toBeUndefined();
    expect(mocks.serviceTokenReplay.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lte: now } },
    });
    expect(mocks.serviceTokenReplay.create).toHaveBeenCalledWith({
      data: {
        issuer: 'veb-api',
        tokenId: 'token-1',
        expiresAt: new Date(1_800_000_120 * 1000),
      },
    });
  });

  it('maps a duplicate token id to an authentication failure', async () => {
    mocks.serviceTokenReplay.create.mockRejectedValue({
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
    });

    await expect(consumeServiceToken(claims())).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
      status: 401,
      message: '服务令牌已被使用',
    });
  });

  it.each(['GET', 'HEAD'])(
    'does not consume retry-safe %s tokens',
    async (method) => {
      await expect(
        consumeServiceToken(claims(method)),
      ).resolves.toBeUndefined();
      expect(mocks.transaction).not.toHaveBeenCalled();
    },
  );
});
