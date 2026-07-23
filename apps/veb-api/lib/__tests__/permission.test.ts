import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../session', () => ({
  requireUser: vi.fn(async () => ({ id: 'u1' })),
}));

vi.mock('../menu', () => ({
  getUserPermissionSnapshot: vi.fn(async (userId: string) => {
    if (userId === 'root')
      return { roleCodes: ['superadmin'], permissionCodes: [] };
    return { roleCodes: ['user'], permissionCodes: ['system:user:view'] };
  }),
  getMenuByPath: vi.fn(async (pathname: string) => {
    if (pathname === '/admin/system/user')
      return { permissionCode: 'system:user:view' };
    if (pathname === '/admin/system/role')
      return { permissionCode: 'system:role:view' };
    return null;
  }),
}));

const permission = await import('../permission');

describe('permission helpers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows superadmin for any code', async () => {
    await expect(permission.hasPermission('root', 'anything')).resolves.toBe(
      true,
    );
  });

  it('checks normal user permission codes', async () => {
    await expect(
      permission.hasPermission('u1', 'system:user:view'),
    ).resolves.toBe(true);
    await expect(
      permission.hasPermission('u1', 'system:user:delete'),
    ).resolves.toBe(false);
  });

  it('checks menu access by path', async () => {
    await expect(
      permission.canAccess('u1', '/admin/system/user'),
    ).resolves.toBe(true);
    await expect(
      permission.canAccess('u1', '/admin/system/role'),
    ).resolves.toBe(false);
  });

  it('allows public admin entry points without a menu permission', async () => {
    await expect(permission.canAccess('u1', '/admin')).resolves.toBe(true);
    await expect(permission.canAccess('u1', '/admin/profile')).resolves.toBe(
      true,
    );
    await expect(permission.canAccess('u1', '/admin/unknown')).resolves.toBe(
      false,
    );
  });
});
