import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assignRoleUsers: vi.fn(),
  getRoleAccessDetail: vi.fn(),
  getRoleUserAssignmentDetail: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock('../api', () => ({
  ok: (data: unknown) => data,
  readJson: vi.fn(),
  withApi: (handler: unknown) => handler,
  withOperationPayload: (response: unknown) => response,
}));

vi.mock('../permission', () => ({
  requirePermission: mocks.requirePermission,
}));

vi.mock('../../src/modules/roles/service', () => ({
  assignRoleAccessWithAudit: vi.fn(),
  assignRoleUsers: mocks.assignRoleUsers,
  getRoleAccessDetail: mocks.getRoleAccessDetail,
  getRoleUserAssignmentDetail: mocks.getRoleUserAssignmentDetail,
}));

const { GET: getAccess } =
  await import('../../app/api/v1/system/roles/[id]/access/route');
const { GET: getUsers } =
  await import('../../app/api/v1/system/roles/[id]/users/route');

describe('role assignment detail route permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue(undefined);
  });

  it('guards access options with assign-access instead of module or menu view', async () => {
    const detail = { id: 'role-1', assignments: [], modules: [], menus: [] };
    mocks.getRoleAccessDetail.mockResolvedValue(detail);

    await expect(
      getAccess(new Request('http://localhost/api/roles/role-1/access'), {
        params: { id: 'role-1' },
      }),
    ).resolves.toEqual(detail);
    expect(mocks.requirePermission).toHaveBeenCalledOnce();
    expect(mocks.requirePermission).toHaveBeenCalledWith(
      'system:role:assign-access',
    );
    expect(mocks.getRoleAccessDetail).toHaveBeenCalledWith('role-1');
  });

  it('guards user options with assign-user instead of user view', async () => {
    const detail = { id: 'role-1', userIds: [], users: [] };
    mocks.getRoleUserAssignmentDetail.mockResolvedValue(detail);

    await expect(
      getUsers(new Request('http://localhost/api/roles/role-1/users'), {
        params: { id: 'role-1' },
      }),
    ).resolves.toEqual(detail);
    expect(mocks.requirePermission).toHaveBeenCalledOnce();
    expect(mocks.requirePermission).toHaveBeenCalledWith(
      'system:role:assign-user',
    );
    expect(mocks.getRoleUserAssignmentDetail).toHaveBeenCalledWith('role-1');
  });

  it('does not load assignment options when the dedicated guard rejects', async () => {
    mocks.requirePermission.mockRejectedValue(new Error('forbidden'));

    await expect(
      getAccess(new Request('http://localhost/api/roles/role-1/access'), {
        params: { id: 'role-1' },
      }),
    ).rejects.toThrow('forbidden');
    expect(mocks.getRoleAccessDetail).not.toHaveBeenCalled();
  });
});
