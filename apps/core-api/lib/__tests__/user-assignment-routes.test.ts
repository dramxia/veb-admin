import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assignUserRoles: vi.fn(),
  createUser: vi.fn(),
  getAuthenticatedUser: vi.fn(() => ({ id: 'actor-1' })),
  readJson: vi.fn(),
}));

vi.mock('../api', () => ({
  ok: (data: unknown) => data,
  pageOptions: vi.fn(),
  readJson: mocks.readJson,
  readQuery: vi.fn(),
  withApi: (handler: unknown) => handler,
  defineApiRoute: (_access: unknown, handler: unknown) => handler,
}));

vi.mock('../session', () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock('../../src/modules/users/service', () => ({
  assignUserRoles: mocks.assignUserRoles,
  createUser: mocks.createUser,
  listUsers: vi.fn(),
}));

const { POST: create } = await import('../../app/api/v1/system/users/route');
const { POST: assign } =
  await import('../../app/api/v1/system/users/[id]/assign-roles/route');

describe('user role assignment route boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the authenticated actor into user creation with roles', async () => {
    const data = {
      username: 'alice',
      password: 'secret12',
      roleIds: ['role-1'],
    };
    mocks.readJson.mockResolvedValue(data);
    mocks.createUser.mockResolvedValue({ id: 'user-1' });

    await create(new Request('http://localhost/api/users'));

    expect(mocks.createUser).toHaveBeenCalledWith('actor-1', data);
  });

  it('passes the authenticated actor into full role replacement', async () => {
    mocks.readJson.mockResolvedValue({ roleIds: ['role-1'] });
    mocks.assignUserRoles.mockResolvedValue({
      id: 'user-1',
      roleIds: ['role-1'],
    });

    await assign(new Request('http://localhost/api/users/user-1/roles'), {
      params: { id: 'user-1' },
    });

    expect(mocks.assignUserRoles).toHaveBeenCalledWith('actor-1', 'user-1', [
      'role-1',
    ]);
  });
});
