import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictError, NotFoundError } from '@/lib/errors';

const prismaMock = vi.hoisted(() => ({
  user: { delete: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/src/modules/role-assignment/policy', () => ({
  assertRolesAssignable: vi.fn(),
}));

import { deleteUser } from '@/src/modules/users/service';

function prismaError(code: string) {
  return Object.assign(new Error(code), {
    name: 'PrismaClientKnownRequestError',
    code,
    clientVersion: '5.22.0',
  });
}

describe('user deletion with authored articles', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the deleted user id when no authored article blocks deletion', async () => {
    prismaMock.user.delete.mockResolvedValue({ id: 'user-1' });
    await expect(deleteUser('user-1')).resolves.toEqual({ id: 'user-1' });
  });

  it('maps a missing user to not found', async () => {
    prismaMock.user.delete.mockRejectedValue(prismaError('P2025'));
    await expect(deleteUser('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('maps the required article author relation to a conflict', async () => {
    prismaMock.user.delete.mockRejectedValue(prismaError('P2003'));
    await expect(deleteUser('author')).rejects.toBeInstanceOf(ConflictError);
  });
});
