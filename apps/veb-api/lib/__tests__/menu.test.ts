import { describe, expect, it, vi } from 'vitest';

const menuRows = [
  {
    id: 'dashboard',
    parentId: null,
    name: 'Dashboard',
    path: '/admin',
    component: null,
    icon: null,
    sort: 0,
    type: 'PAGE',
    permissionCode: null,
    visible: true,
    status: 'ENABLED',
    externalUrl: null,
  },
  {
    id: 'root',
    parentId: null,
    name: 'System',
    path: '/admin/system',
    component: null,
    icon: null,
    sort: 1,
    type: 'DIR',
    permissionCode: null,
    visible: true,
    status: 'ENABLED',
    externalUrl: null,
  },
  {
    id: 'user',
    parentId: 'root',
    name: 'User',
    path: '/admin/system/user',
    component: 'system/user/page',
    icon: null,
    sort: 1,
    type: 'PAGE',
    permissionCode: 'system:user:view',
    visible: true,
    status: 'ENABLED',
    externalUrl: null,
  },
  {
    id: 'role',
    parentId: 'root',
    name: 'Role',
    path: '/admin/system/role',
    component: 'system/role/page',
    icon: null,
    sort: 2,
    type: 'PAGE',
    permissionCode: 'system:role:view',
    visible: true,
    status: 'ENABLED',
    externalUrl: null,
  },
  {
    id: 'legacy-audit',
    parentId: 'root',
    name: 'Legacy audit',
    path: '/system/audit',
    component: 'system/audit/page',
    icon: null,
    sort: 3,
    type: 'PAGE',
    permissionCode: 'system:audit:view',
    visible: true,
    status: 'ENABLED',
    externalUrl: null,
  },
  {
    id: 'empty',
    parentId: null,
    name: 'Empty',
    path: '/admin/empty',
    component: null,
    icon: null,
    sort: 9,
    type: 'DIR',
    permissionCode: null,
    visible: true,
    status: 'ENABLED',
    externalUrl: null,
  },
];

vi.mock('../permission-cache', () => ({
  getCachedPermissions: vi.fn(() => null),
  setCachedPermissions: vi.fn((_userId, snapshot) => snapshot),
}));

vi.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => ({
        status: 'ENABLED',
        roles: [
          {
            role: {
              code: 'user',
              permissions: [{ permission: { code: 'system:user:view' } }],
            },
          },
        ],
      })),
    },
    menu: {
      findMany: vi.fn(async () => menuRows),
    },
    permission: {
      findMany: vi.fn(async () => [
        { code: 'system:user:view' },
        { code: 'system:role:view' },
      ]),
    },
  },
}));

const menu = await import('../menu');

describe('menu aggregation', () => {
  it('prunes inaccessible pages and empty dirs', async () => {
    const result = await menu.getUserMenuAndPermissions('u1');
    expect(result.permissionCodes).toEqual(['system:user:view']);
    expect(result.menus.map((item) => item.id)).toEqual(['dashboard', 'root']);
    expect(
      result.menus
        .find((item) => item.id === 'root')
        ?.children.map((item) => item.id),
    ).toEqual(['user']);
  });

  it('matches migrated routes against new and legacy stored menu paths', async () => {
    await expect(
      menu.getMenuByPath('/admin/system/user/detail'),
    ).resolves.toMatchObject({ id: 'user' });
    await expect(menu.getMenuByPath('/admin')).resolves.toMatchObject({
      id: 'dashboard',
    });
    await expect(menu.getMenuByPath('/admin/unknown')).resolves.toBeNull();
    await expect(
      menu.getMenuByPath('/admin/system/audit/detail'),
    ).resolves.toMatchObject({ id: 'legacy-audit' });
    await expect(menu.getMenuByPath('/system/user')).resolves.toBeNull();
    await expect(menu.getMenuByPath('/system/audit')).resolves.toBeNull();
  });
});
