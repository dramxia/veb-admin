import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assignRoleAccessWithAudit: vi.fn(),
  assignRoleUsers: vi.fn(),
  assertRoleAccessAssignable: vi.fn(),
  assertRolesAssignable: vi.fn(),
  getRoleAccessDetail: vi.fn(),
  getRoleUserAssignmentDetail: vi.fn(),
  readJson: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock('../api', () => ({
  ok: (data: unknown) => data,
  readJson: mocks.readJson,
  withApi: (handler: unknown) => handler,
  withOperationPayload: (response: unknown) => response,
}));

vi.mock('../permission', () => ({
  requirePermission: mocks.requirePermission,
}));

vi.mock('../../src/modules/roles/service', () => ({
  assignRoleAccessWithAudit: mocks.assignRoleAccessWithAudit,
  assignRoleUsers: mocks.assignRoleUsers,
  getRoleAccessDetail: mocks.getRoleAccessDetail,
  getRoleUserAssignmentDetail: mocks.getRoleUserAssignmentDetail,
}));

vi.mock('../../src/modules/role-assignment/policy', () => ({
  assertRoleAccessAssignable: mocks.assertRoleAccessAssignable,
  assertRolesAssignable: mocks.assertRolesAssignable,
}));

const { GET: getAccess } =
  await import('../../app/api/v1/system/roles/[id]/access/route');
const { PUT: putAccess } =
  await import('../../app/api/v1/system/roles/[id]/access/route');
const { GET: getUsers, POST: postUsers } =
  await import('../../app/api/v1/system/roles/[id]/users/route');

describe('role assignment detail route permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: 'actor-1' });
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

  it('passes the authenticated actor through both role mutation boundaries', async () => {
    mocks.readJson
      .mockResolvedValueOnce({ userIds: ['user-1'] })
      .mockResolvedValueOnce({
        modules: [{ moduleId: 'module-1', menuIds: ['menu-1'] }],
      });
    mocks.assignRoleUsers.mockResolvedValue({
      id: 'role-1',
      userIds: ['user-1'],
    });
    mocks.assignRoleAccessWithAudit.mockResolvedValue({
      result: { id: 'role-1', modules: [] },
      audit: { before: [], after: [] },
    });

    await postUsers(new Request('http://localhost/api/roles/role-1/users'), {
      params: { id: 'role-1' },
    });
    expect(mocks.assignRoleUsers).toHaveBeenCalledWith('actor-1', 'role-1', [
      'user-1',
    ]);

    await putAccess(new Request('http://localhost/api/roles/role-1/access'), {
      params: { id: 'role-1' },
    });
    expect(mocks.assertRolesAssignable).toHaveBeenCalledWith('actor-1', [
      'role-1',
    ]);
    expect(mocks.assertRoleAccessAssignable).toHaveBeenCalledWith('actor-1', [
      { moduleId: 'module-1', menuIds: ['menu-1'] },
    ]);
  });
});
