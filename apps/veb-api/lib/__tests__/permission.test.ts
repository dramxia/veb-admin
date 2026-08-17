import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../session', () => ({
  requireUser: vi.fn(async () => ({ id: 'u1' })),
}));

vi.mock('../menu', () => ({
  getUserPermissionSnapshot: vi.fn(async (userId: string) => {
    if (userId === 'root') {
      return {
        roleCodes: ['superadmin'],
        moduleIds: ['m1'],
        permissionCodes: ['system:registered:view'],
      };
    }
    if (userId === 'no-module') {
      return { roleCodes: ['user'], moduleIds: [], permissionCodes: [] };
    }
    return {
      roleCodes: ['user'],
      moduleIds: ['m1'],
      permissionCodes: ['dashboard:view', 'system:user:view'],
    };
  }),
  getMenuByPath: vi.fn(async (pathname: string) => {
    if (pathname === '/dashboard') {
      return {
        moduleId: 'm1',
        type: 'PAGE',
        permissionCode: 'dashboard:view',
      };
    }
    if (pathname === '/admin/system/user') {
      return {
        moduleId: 'm1',
        type: 'PAGE',
        permissionCode: 'system:user:view',
      };
    }
    if (pathname === '/admin/system/role') {
      return {
        moduleId: 'm1',
        type: 'PAGE',
        permissionCode: 'system:role:view',
      };
    }
    return null;
  }),
}));

const permission = await import('../permission');

describe('permission helpers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('checks only effective permission codes, including for superadmin', async () => {
    await expect(
      permission.hasPermission('root', 'system:registered:view'),
    ).resolves.toBe(true);
    await expect(permission.hasPermission('root', 'anything')).resolves.toBe(
      false,
    );
    await expect(
      permission.hasPermission('u1', 'system:user:view'),
    ).resolves.toBe(true);
    await expect(
      permission.hasPermission('u1', 'system:user:delete'),
    ).resolves.toBe(false);
  });

  it('checks module ownership and PAGE permission together', async () => {
    await expect(
      permission.canAccess('u1', '/admin/system/user'),
    ).resolves.toBe(true);
    await expect(
      permission.canAccess('u1', '/admin/system/role'),
    ).resolves.toBe(false);
    await expect(
      permission.canAccess('no-module', '/admin/system/user'),
    ).resolves.toBe(false);
  });

  it('treats the module landing page as an ordinary authorized PAGE', async () => {
    await expect(permission.canAccess('u1', '/dashboard')).resolves.toBe(true);
    await expect(permission.canAccess('no-module', '/dashboard')).resolves.toBe(
      false,
    );
  });

  it('keeps global pages public to authenticated users and rejects unknown paths', async () => {
    await expect(permission.canAccess('u1', '/')).resolves.toBe(true);
    await expect(permission.canAccess('u1', '/profile')).resolves.toBe(true);
    await expect(permission.canAccess('u1', '/admin/profile')).resolves.toBe(
      true,
    );
    await expect(permission.canAccess('u1', '/admin/unknown')).resolves.toBe(
      false,
    );
    await expect(permission.canAccess('u1', '/admin/docs')).resolves.toBe(
      false,
    );
  });
});
