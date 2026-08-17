import {
  appModuleCreateInputSchema,
  appModuleUpdateInputSchema,
} from '@veb/api-contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../generated/client';

const mocks = vi.hoisted(() => {
  const appModule = {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return {
    ...appModule,
    menuGroupBy: vi.fn(),
    transaction: vi.fn(
      async (callback: (tx: { appModule: typeof appModule }) => unknown) =>
        callback({ appModule }),
    ),
    invalidatePermissionCache: vi.fn(),
  };
});

vi.mock('../prisma', () => ({
  prisma: {
    appModule: {
      count: mocks.count,
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      create: mocks.create,
      update: mocks.update,
      delete: mocks.delete,
    },
    menu: { groupBy: mocks.menuGroupBy },
    $transaction: mocks.transaction,
  },
}));

vi.mock('../permission-cache', () => ({
  invalidatePermissionCache: mocks.invalidatePermissionCache,
}));

const { createAppModule, deleteAppModule, listAppModules, updateAppModule } =
  await import('../../src/modules/modules/service');

const baseModule = {
  id: 'module-example',
  code: 'example',
  name: '示例模块',
  description: null,
  icon: null,
  sort: 10,
  status: 'ENABLED',
  isSystem: false,
  createdAt: new Date('2026-07-23T00:00:00.000Z'),
  updatedAt: new Date('2026-07-23T00:00:00.000Z'),
  _count: { menus: 0, roles: 0 },
} as const;

describe('app module service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.menuGroupBy.mockResolvedValue([]);
  });

  it('creates a metadata-only module', async () => {
    const data = appModuleCreateInputSchema.parse({
      code: 'example',
      name: '示例模块',
      description: '业务导航分组',
      icon: 'Boxes',
      sort: 10,
    });
    mocks.create.mockResolvedValue({
      ...baseModule,
      description: data.description ?? null,
      icon: data.icon ?? null,
    });

    await expect(createAppModule(data)).resolves.toMatchObject({
      code: 'example',
      name: '示例模块',
      description: '业务导航分组',
      icon: 'Boxes',
      _count: { menus: 0, buttons: 0, roles: 0 },
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data,
      select: expect.any(Object),
    });
    expect(mocks.invalidatePermissionCache).toHaveBeenCalledOnce();
  });

  it('rejects retired module component and route fields at the contract boundary', () => {
    expect(
      appModuleCreateInputSchema.safeParse({
        code: 'example',
        name: '示例模块',
        componentKey: 'example/home',
      }).success,
    ).toBe(false);
    expect(
      appModuleCreateInputSchema.safeParse({
        code: 'example',
        name: '示例模块',
        homePath: '/example',
      }).success,
    ).toBe(false);
  });

  it('maps a module code uniqueness violation to a conflict', async () => {
    const data = appModuleCreateInputSchema.parse({
      code: 'example',
      name: '示例模块',
    });
    mocks.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique constraint', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['code'] },
      }),
    );

    await expect(createAppModule(data)).rejects.toMatchObject({
      message: '模块编码已存在',
    });
    expect(mocks.invalidatePermissionCache).not.toHaveBeenCalled();
  });

  it('reports navigation, button, and role counts separately', async () => {
    mocks.count.mockResolvedValue(1);
    mocks.findMany.mockResolvedValue([
      { ...baseModule, _count: { menus: 3, roles: 2 } },
    ]);
    mocks.menuGroupBy.mockResolvedValue([
      { moduleId: baseModule.id, type: 'DIR', _count: { _all: 1 } },
      { moduleId: baseModule.id, type: 'PAGE', _count: { _all: 2 } },
      { moduleId: baseModule.id, type: 'BUTTON', _count: { _all: 4 } },
    ]);

    const result = await listAppModules({
      page: 1,
      pageSize: 20,
      skip: 0,
    });

    expect(result.items[0]?._count).toEqual({
      menus: 3,
      buttons: 4,
      roles: 2,
    });
  });

  it('does not allow disabling the built-in admin module', async () => {
    mocks.findUnique.mockResolvedValue({
      ...baseModule,
      id: 'module-admin',
      code: 'admin',
      isSystem: true,
    });
    const data = appModuleUpdateInputSchema.parse({ status: 'DISABLED' });

    await expect(updateAppModule('module-admin', data)).rejects.toMatchObject({
      message: '内置模块只允许修改名称、图标和排序',
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('updates custom module metadata and resolves its current counts', async () => {
    const data = appModuleUpdateInputSchema.parse({
      name: '报表中心',
      description: '统计分析',
      status: 'DISABLED',
    });
    const updated = {
      ...baseModule,
      name: '报表中心',
      description: '统计分析',
      status: 'DISABLED',
    };
    mocks.findUnique.mockResolvedValue(baseModule);
    mocks.update.mockResolvedValue(updated);
    mocks.menuGroupBy.mockResolvedValue([
      { moduleId: baseModule.id, type: 'PAGE', _count: { _all: 1 } },
      { moduleId: baseModule.id, type: 'BUTTON', _count: { _all: 2 } },
    ]);

    await expect(updateAppModule(baseModule.id, data)).resolves.toMatchObject({
      name: '报表中心',
      description: '统计分析',
      status: 'DISABLED',
      _count: { menus: 1, buttons: 2, roles: 0 },
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: baseModule.id },
      data,
      select: expect.any(Object),
    });
    expect(mocks.invalidatePermissionCache).toHaveBeenCalledOnce();
  });

  it('rejects deletion while roles or menus are associated', async () => {
    mocks.findUnique.mockResolvedValue({
      ...baseModule,
      _count: { menus: 1, roles: 0 },
    });

    await expect(deleteAppModule(baseModule.id)).rejects.toMatchObject({
      message: '模块已关联角色或菜单，不能删除',
    });
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it('deletes an unreferenced custom module and invalidates authorization data', async () => {
    mocks.findUnique.mockResolvedValue(baseModule);
    mocks.delete.mockResolvedValue(baseModule);

    await expect(deleteAppModule(baseModule.id)).resolves.toEqual({
      id: baseModule.id,
    });
    expect(mocks.delete).toHaveBeenCalledWith({ where: { id: baseModule.id } });
    expect(mocks.invalidatePermissionCache).toHaveBeenCalledOnce();
  });

  it('maps a concurrent relation created during deletion to a conflict', async () => {
    mocks.findUnique.mockResolvedValue(baseModule);
    mocks.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('foreign key constraint', {
        code: 'P2003',
        clientVersion: 'test',
      }),
    );

    await expect(deleteAppModule(baseModule.id)).rejects.toMatchObject({
      message: '模块已关联角色或菜单，不能删除',
    });
    expect(mocks.invalidatePermissionCache).not.toHaveBeenCalled();
  });
});
