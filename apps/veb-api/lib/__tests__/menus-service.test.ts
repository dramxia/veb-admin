import { menuCreateInputSchema } from '@veb/api-contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(async ({ data }: { data: unknown }) => data),
  findUniqueMenu: vi.fn(),
  findManyMenus: vi.fn(),
  findUniqueAppModule: vi.fn(),
  findManyAppModules: vi.fn(),
  transaction: vi.fn(),
  invalidatePermissionCache: vi.fn(),
}));

vi.mock('../prisma', () => {
  const transactionClient = {
    menu: {
      create: mocks.create,
      findUnique: mocks.findUniqueMenu,
      findMany: mocks.findManyMenus,
    },
    appModule: {
      findUnique: mocks.findUniqueAppModule,
      findMany: mocks.findManyAppModules,
    },
  };
  mocks.transaction.mockImplementation(
    async (callback: (tx: typeof transactionClient) => unknown) =>
      callback(transactionClient),
  );
  return {
    prisma: {
      ...transactionClient,
      $transaction: mocks.transaction,
    },
  };
});

vi.mock('../permission-cache', () => ({
  invalidatePermissionCache: mocks.invalidatePermissionCache,
}));

const { createMenu, listMenus } =
  await import('../../src/modules/menus/service');

describe('menu service validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueAppModule.mockResolvedValue({ id: 'module-admin' });
    mocks.findManyMenus.mockResolvedValue([]);
    mocks.findManyAppModules.mockResolvedValue([]);
  });

  it('returns menu-scoped minimal module options without module management data', async () => {
    const items = [{ id: 'menu-user', moduleId: 'module-admin' }];
    const modules = [{ id: 'module-admin', name: '系统管理' }];
    mocks.findManyMenus.mockResolvedValue(items);
    mocks.findManyAppModules.mockResolvedValue(modules);

    await expect(listMenus({ moduleId: 'module-admin' })).resolves.toEqual({
      items,
      modules,
    });
    expect(mocks.findManyMenus).toHaveBeenCalledWith({
      where: { moduleId: 'module-admin' },
      orderBy: [{ sort: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    });
    expect(mocks.findManyAppModules).toHaveBeenCalledWith({
      select: { id: true, name: true },
      orderBy: [{ sort: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    });
  });

  it('normalizes a LINK to an external-only resource', async () => {
    const data = menuCreateInputSchema.parse({
      moduleId: 'module-admin',
      name: '项目文档',
      type: 'LINK',
      permissionCode: 'docs:view',
      externalUrl: 'https://example.com/docs',
    });

    await expect(createMenu(data)).resolves.toMatchObject({
      type: 'LINK',
      path: null,
      component: null,
      externalUrl: 'https://example.com/docs',
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        moduleId: 'module-admin',
        name: '项目文档',
        description: null,
        sort: 0,
        status: 'ENABLED',
        isSystem: false,
        type: 'LINK',
        parentId: null,
        path: null,
        component: null,
        icon: null,
        permissionCode: 'docs:view',
        visible: true,
        externalUrl: 'https://example.com/docs',
      },
    });
    expect(mocks.invalidatePermissionCache).toHaveBeenCalledOnce();
  });

  it('creates a BUTTON directly under a PAGE and clears navigation fields', async () => {
    mocks.findUniqueMenu.mockResolvedValue({
      id: 'page-report',
      moduleId: 'module-admin',
      type: 'PAGE',
    });
    const data = menuCreateInputSchema.parse({
      moduleId: 'module-admin',
      parentId: 'page-report',
      name: '导出报表',
      description: '下载报表文件',
      type: 'BUTTON',
      permissionCode: 'report:export',
      sort: 20,
    });

    await expect(createMenu(data)).resolves.toMatchObject({
      type: 'BUTTON',
      parentId: 'page-report',
      path: null,
      component: null,
      icon: null,
      visible: false,
      externalUrl: null,
    });
    expect(mocks.invalidatePermissionCache).toHaveBeenCalledOnce();
  });

  it('rejects a BUTTON whose direct parent is not a PAGE', async () => {
    mocks.findUniqueMenu.mockResolvedValue({
      id: 'dir-system',
      moduleId: 'module-admin',
      type: 'DIR',
    });
    const data = menuCreateInputSchema.parse({
      moduleId: 'module-admin',
      parentId: 'dir-system',
      name: '删除报表',
      type: 'BUTTON',
      permissionCode: 'report:delete',
    });

    await expect(createMenu(data)).rejects.toMatchObject({
      message: '按钮必须直属页面',
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.invalidatePermissionCache).not.toHaveBeenCalled();
  });

  it('rejects a navigation node whose parent is a PAGE', async () => {
    mocks.findUniqueMenu.mockResolvedValue({
      id: 'page-report',
      moduleId: 'module-admin',
      type: 'PAGE',
    });
    const data = menuCreateInputSchema.parse({
      moduleId: 'module-admin',
      parentId: 'page-report',
      name: '报表详情',
      path: '/reports/detail',
      component: 'reports/detail/page',
      type: 'PAGE',
      permissionCode: 'report:detail',
    });

    await expect(createMenu(data)).rejects.toMatchObject({
      message: '目录、页面和外链的父级只能是目录',
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('rejects a parent menu from another module', async () => {
    mocks.findUniqueMenu.mockResolvedValue({
      id: 'dir-example',
      moduleId: 'module-example',
      type: 'DIR',
    });
    const data = menuCreateInputSchema.parse({
      moduleId: 'module-admin',
      parentId: 'dir-example',
      name: '跨模块页面',
      path: '/cross-module',
      component: 'cross-module/page',
      type: 'PAGE',
      permissionCode: 'cross:view',
    });

    await expect(createMenu(data)).rejects.toMatchObject({
      message: '父菜单必须与当前菜单属于同一模块',
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('rejects creation when the selected module does not exist', async () => {
    mocks.findUniqueAppModule.mockResolvedValue(null);
    const data = menuCreateInputSchema.parse({
      moduleId: 'module-missing',
      name: '报表',
      path: '/reports',
      component: 'reports/page',
      type: 'PAGE',
      permissionCode: 'report:view',
    });

    await expect(createMenu(data)).rejects.toMatchObject({
      message: '所属模块不存在',
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('rejects fields that do not belong to a menu type at the contract boundary', () => {
    expect(
      menuCreateInputSchema.safeParse({
        moduleId: 'module-admin',
        parentId: 'page-report',
        name: '错误按钮',
        type: 'BUTTON',
        permissionCode: 'report:update',
        path: '/reports/update',
      }).success,
    ).toBe(false);
    expect(
      menuCreateInputSchema.safeParse({
        moduleId: 'module-admin',
        name: '错误目录',
        type: 'DIR',
        permissionCode: 'report:dir',
      }).success,
    ).toBe(false);
  });
});
