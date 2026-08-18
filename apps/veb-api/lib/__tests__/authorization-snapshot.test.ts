import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  moduleFindMany: vi.fn(),
  menuFindMany: vi.fn(),
}));

vi.mock('../prisma', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    appModule: { findMany: mocks.moduleFindMany },
    menu: { findMany: mocks.menuFindMany },
  },
}));

const { getUserPermissionSnapshot } =
  await import('../../src/modules/navigation/service');

function menu(
  id: string,
  moduleId: string,
  permissionCode: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    moduleId,
    parentId: null,
    type: 'PAGE',
    permissionCode,
    status: 'ENABLED',
    visible: true,
    ...overrides,
  };
}

describe('authorization snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.menuFindMany.mockResolvedValue([]);
  });

  it('does not join a module from one role with a menu grant from another', async () => {
    mocks.userFindUnique.mockResolvedValue({
      status: 'ENABLED',
      roles: [
        {
          role: {
            code: 'module-a-role',
            modules: [{ moduleId: 'module-a' }],
            menus: [{ menuId: 'menu-b', moduleId: 'module-b' }],
          },
        },
        {
          role: {
            code: 'module-b-role',
            modules: [{ moduleId: 'module-b' }],
            menus: [{ menuId: 'menu-a', moduleId: 'module-a' }],
          },
        },
      ],
    });
    mocks.menuFindMany.mockResolvedValue([
      menu('menu-a', 'module-a', 'module-a:read'),
      menu('menu-b', 'module-b', 'module-b:read'),
    ]);

    await expect(getUserPermissionSnapshot('u1')).resolves.toEqual({
      roleCodes: ['module-a-role', 'module-b-role'],
      moduleIds: ['module-a', 'module-b'],
      permissionCodes: [],
    });
  });

  it('keeps effective menu codes when the same role owns their enabled module', async () => {
    mocks.userFindUnique.mockResolvedValue({
      status: 'ENABLED',
      roles: [
        {
          role: {
            code: 'editor',
            modules: [{ moduleId: 'module-a' }],
            menus: [
              { menuId: 'menu-a', moduleId: 'module-a' },
              { menuId: 'menu-disabled', moduleId: 'module-a' },
            ],
          },
        },
      ],
    });
    mocks.menuFindMany.mockResolvedValue([
      menu('menu-a', 'module-a', 'module-a:read'),
      menu('menu-disabled', 'module-a', 'module-a:delete', {
        status: 'DISABLED',
      }),
    ]);

    await expect(getUserPermissionSnapshot('u1')).resolves.toEqual({
      roleCodes: ['editor'],
      moduleIds: ['module-a'],
      permissionCodes: ['module-a:read'],
    });
  });

  it('invalidates a node immediately when an ancestor is disabled', async () => {
    mocks.userFindUnique.mockResolvedValue({
      status: 'ENABLED',
      roles: [
        {
          role: {
            code: 'editor',
            modules: [{ moduleId: 'module-a' }],
            menus: [{ menuId: 'menu-a', moduleId: 'module-a' }],
          },
        },
      ],
    });
    mocks.menuFindMany.mockResolvedValue([
      menu('dir-disabled', 'module-a', '', {
        type: 'DIR',
        permissionCode: null,
        status: 'DISABLED',
      }),
      menu('menu-a', 'module-a', 'module-a:read', {
        parentId: 'dir-disabled',
      }),
    ]);

    await expect(getUserPermissionSnapshot('u1')).resolves.toMatchObject({
      moduleIds: ['module-a'],
      permissionCodes: [],
    });
  });

  it('recomputes from the database so the next request observes revocation', async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce({
        status: 'ENABLED',
        roles: [
          {
            role: {
              code: 'editor',
              modules: [{ moduleId: 'module-a' }],
              menus: [{ menuId: 'menu-a', moduleId: 'module-a' }],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 'ENABLED',
        roles: [
          {
            role: {
              code: 'editor',
              modules: [{ moduleId: 'module-a' }],
              menus: [],
            },
          },
        ],
      });
    mocks.menuFindMany.mockResolvedValue([
      menu('menu-a', 'module-a', 'module-a:read'),
    ]);

    await expect(getUserPermissionSnapshot('u1')).resolves.toMatchObject({
      permissionCodes: ['module-a:read'],
    });
    await expect(getUserPermissionSnapshot('u1')).resolves.toMatchObject({
      permissionCodes: [],
    });

    expect(mocks.userFindUnique).toHaveBeenCalledTimes(2);
  });

  it('expands superadmin to effective nodes in enabled modules', async () => {
    mocks.userFindUnique.mockResolvedValue({
      status: 'ENABLED',
      roles: [
        {
          role: {
            code: 'superadmin',
            modules: [],
            menus: [],
          },
        },
      ],
    });
    mocks.moduleFindMany.mockResolvedValue([
      {
        id: 'module-a',
        menus: [
          menu('page-a', 'module-a', 'module-a:read'),
          menu('button-a', 'module-a', 'module-a:write', {
            parentId: 'page-a',
            type: 'BUTTON',
            visible: false,
          }),
          menu('disabled-button', 'module-a', 'module-a:delete', {
            parentId: 'page-a',
            type: 'BUTTON',
            status: 'DISABLED',
            visible: false,
          }),
        ],
      },
    ]);

    await expect(getUserPermissionSnapshot('root')).resolves.toEqual({
      roleCodes: ['superadmin'],
      moduleIds: ['module-a'],
      permissionCodes: ['module-a:read', 'module-a:write'],
    });
    expect(mocks.moduleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'ENABLED' } }),
    );
  });
});
