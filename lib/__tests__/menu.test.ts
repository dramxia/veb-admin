import { describe, expect, it, vi } from 'vitest';

const menuRows = [
  { id: 'root', parentId: null, name: 'System', path: '/system', component: null, icon: null, sort: 1, type: 'DIR', permissionCode: null, visible: true, status: 'ENABLED', externalUrl: null },
  { id: 'user', parentId: 'root', name: 'User', path: '/system/user', component: 'system/user/page', icon: null, sort: 1, type: 'PAGE', permissionCode: 'system:user:view', visible: true, status: 'ENABLED', externalUrl: null },
  { id: 'role', parentId: 'root', name: 'Role', path: '/system/role', component: 'system/role/page', icon: null, sort: 2, type: 'PAGE', permissionCode: 'system:role:view', visible: true, status: 'ENABLED', externalUrl: null },
  { id: 'empty', parentId: null, name: 'Empty', path: '/empty', component: null, icon: null, sort: 9, type: 'DIR', permissionCode: null, visible: true, status: 'ENABLED', externalUrl: null },
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
        roles: [{ role: { code: 'user', permissions: [{ permission: { code: 'system:user:view' } }] } }],
      })),
    },
    menu: {
      findMany: vi.fn(async () => menuRows),
    },
    permission: {
      findMany: vi.fn(async () => [{ code: 'system:user:view' }, { code: 'system:role:view' }]),
    },
  },
}));

const menu = await import('../menu');

describe('menu aggregation', () => {
  it('prunes inaccessible pages and empty dirs', async () => {
    const result = await menu.getUserMenuAndPermissions('u1');
    expect(result.permissionCodes).toEqual(['system:user:view']);
    expect(result.menus).toHaveLength(1);
    expect(result.menus[0]?.children.map((item) => item.id)).toEqual(['user']);
  });
});
