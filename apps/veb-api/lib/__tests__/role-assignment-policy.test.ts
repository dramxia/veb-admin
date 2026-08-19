import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUserPermissionSnapshot: vi.fn(),
  roleFindMany: vi.fn(),
  menuFindMany: vi.fn(),
}));

vi.mock('../../src/modules/navigation/service', () => ({
  getUserPermissionSnapshot: mocks.getUserPermissionSnapshot,
}));

vi.mock('../prisma', () => ({
  prisma: {
    role: { findMany: mocks.roleFindMany },
    menu: { findMany: mocks.menuFindMany },
  },
}));

const { assertRoleAccessAssignable, assertRolesAssignable } =
  await import('../../src/modules/role-assignment/policy');

function role(
  overrides: {
    code?: string;
    moduleIds?: string[];
    permissionCodes?: string[];
  } = {},
) {
  const moduleIds = overrides.moduleIds ?? ['module-admin'];
  return {
    id: 'role-editor',
    code: overrides.code ?? 'editor',
    modules: moduleIds.map((moduleId) => ({ moduleId })),
    menus: (overrides.permissionCodes ?? ['content:article:view']).map(
      (permissionCode) => ({
        moduleId: moduleIds[0],
        menu: { permissionCode },
      }),
    ),
  };
}

describe('role assignment policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserPermissionSnapshot.mockResolvedValue({
      roleCodes: ['admin'],
      moduleIds: ['module-admin'],
      permissionCodes: ['content:article:view', 'system:user:assign-role'],
    });
    mocks.roleFindMany.mockResolvedValue([role()]);
    mocks.menuFindMany.mockResolvedValue([]);
  });

  it('allows only roles covered by the actor effective access', async () => {
    await expect(
      assertRolesAssignable('actor-1', ['role-editor']),
    ).resolves.toBeUndefined();

    mocks.roleFindMany.mockResolvedValue([
      role({ permissionCodes: ['content:article:delete'] }),
    ]);
    await expect(
      assertRolesAssignable('actor-1', ['role-editor']),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('rejects superadmin assignment by a non-superadmin', async () => {
    mocks.roleFindMany.mockResolvedValue([role({ code: 'superadmin' })]);

    await expect(
      assertRolesAssignable('actor-1', ['role-editor']),
    ).rejects.toMatchObject({
      status: 403,
      message: '只有超级管理员可以分配超级管理员角色',
    });
  });

  it('lets a superadmin assign any existing role', async () => {
    mocks.getUserPermissionSnapshot.mockResolvedValue({
      roleCodes: ['superadmin'],
      moduleIds: [],
      permissionCodes: [],
    });
    mocks.roleFindMany.mockResolvedValue([role({ code: 'superadmin' })]);

    await expect(
      assertRolesAssignable('root', ['role-editor']),
    ).resolves.toBeUndefined();
  });

  it('rejects missing role ids before assignment', async () => {
    mocks.roleFindMany.mockResolvedValue([]);

    await expect(
      assertRolesAssignable('actor-1', ['missing-role']),
    ).rejects.toMatchObject({ status: 400, message: '角色不存在' });
  });

  it('limits role access replacement to the actor effective access', async () => {
    mocks.menuFindMany.mockResolvedValue([
      { permissionCode: 'content:article:view' },
    ]);
    await expect(
      assertRoleAccessAssignable('actor-1', [
        { moduleId: 'module-admin', menuIds: ['menu-article'] },
      ]),
    ).resolves.toBeUndefined();

    mocks.menuFindMany.mockResolvedValue([
      { permissionCode: 'content:article:delete' },
    ]);
    await expect(
      assertRoleAccessAssignable('actor-1', [
        { moduleId: 'module-admin', menuIds: ['menu-delete'] },
      ]),
    ).rejects.toMatchObject({ status: 403 });
  });
});
