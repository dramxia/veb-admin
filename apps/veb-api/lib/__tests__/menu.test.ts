import { describe, expect, it, vi } from 'vitest';

const menuRows = [
  {
    id: 'legacy-admin',
    moduleId: 'admin-module',
    parentId: null,
    name: 'Legacy admin landing',
    description: null,
    path: '/admin',
    component: 'dashboard/page',
    icon: null,
    sort: -1,
    type: 'PAGE',
    permissionCode: 'dashboard:view',
    visible: true,
    status: 'ENABLED',
    externalUrl: null,
  },
  {
    id: 'dashboard',
    moduleId: 'admin-module',
    parentId: null,
    name: 'Dashboard',
    description: null,
    path: '/dashboard',
    component: 'dashboard/page',
    icon: null,
    sort: 0,
    type: 'PAGE',
    permissionCode: 'dashboard:view',
    visible: true,
    status: 'ENABLED',
    externalUrl: null,
  },
  {
    id: 'root',
    moduleId: 'admin-module',
    parentId: null,
    name: 'System',
    description: null,
    path: null,
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
    moduleId: 'admin-module',
    parentId: 'root',
    name: 'User',
    description: null,
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
    moduleId: 'admin-module',
    parentId: 'root',
    name: 'Role',
    description: null,
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
    id: 'audit',
    moduleId: 'admin-module',
    parentId: 'root',
    name: 'Audit',
    description: null,
    path: '/admin/system/audit',
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
    moduleId: 'admin-module',
    parentId: null,
    name: 'Empty',
    description: null,
    path: null,
    component: null,
    icon: null,
    sort: 9,
    type: 'DIR',
    permissionCode: null,
    visible: true,
    status: 'ENABLED',
    externalUrl: null,
  },
  {
    id: 'docs',
    moduleId: 'admin-module',
    parentId: null,
    name: 'Docs',
    description: null,
    path: null,
    component: null,
    icon: null,
    sort: 10,
    type: 'LINK',
    permissionCode: 'system:docs:view',
    visible: true,
    status: 'ENABLED',
    externalUrl: 'https://example.com/docs',
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
              modules: [{ moduleId: 'admin-module' }],
              menus: [
                { menuId: 'dashboard', moduleId: 'admin-module' },
                { menuId: 'user', moduleId: 'admin-module' },
              ],
            },
          },
        ],
      })),
    },
    menu: {
      findMany: vi.fn(async () => menuRows),
    },
    appModule: {
      findMany: vi.fn(async () => [
        {
          id: 'admin-module',
          code: 'admin',
          name: '后台管理',
          description: null,
          icon: null,
          sort: 0,
          status: 'ENABLED',
          isSystem: true,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          menus: menuRows,
        },
      ]),
    },
  },
}));

const menu = await import('../menu');

describe('menu aggregation', () => {
  it('prunes inaccessible pages and empty dirs and resolves a module landing page', async () => {
    const result = await menu.getUserMenuAndPermissions('u1');
    expect(result.permissionCodes).toEqual([
      'dashboard:view',
      'system:user:view',
    ]);
    expect(result.modules).toHaveLength(1);
    expect(result.modules[0]?.landingPath).toBe('/dashboard');
    expect(result.menus.map((item) => item.id)).toEqual([
      'legacy-admin',
      'dashboard',
      'root',
    ]);
    expect(
      result.menus
        .find((item) => item.id === 'root')
        ?.children.map((item) => item.id),
    ).toEqual(['user']);
  });

  it('uses the longest matching PAGE path and never resolves external links', async () => {
    await expect(
      menu.getMenuByPath('/admin/system/user/detail'),
    ).resolves.toMatchObject({ id: 'user' });
    await expect(menu.getMenuByPath('/dashboard/')).resolves.toMatchObject({
      id: 'dashboard',
    });
    await expect(menu.getMenuByPath('/dashboard/unknown')).resolves.toBeNull();
    await expect(
      menu.getMenuByPath('/admin/system/audit/detail'),
    ).resolves.toMatchObject({ id: 'audit' });
    await expect(menu.getMenuByPath('/system/audit')).resolves.toBeNull();
    await expect(menu.getMenuByPath('/admin/docs')).resolves.toBeNull();
  });

  it('distinguishes unknown pages from known but unauthorized pages', async () => {
    await expect(
      menu.resolveUserPage('u1', '/admin/system/user/detail'),
    ).resolves.toEqual({
      id: 'user',
      moduleId: 'admin-module',
      path: '/admin/system/user',
      component: 'system/user/page',
    });
    await expect(
      menu.resolveUserPage('u1', '/admin/system/role'),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      menu.resolveUserPage('u1', '/admin/unknown'),
    ).rejects.toMatchObject({ status: 404, message: '页面不存在' });
  });
});
