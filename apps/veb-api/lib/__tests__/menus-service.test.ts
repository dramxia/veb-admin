import { menuCreateInputSchema } from '@veb/api-contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(async ({ data }: { data: unknown }) => data),
  findUniqueMenu: vi.fn(),
  findUniquePermission: vi.fn(),
  invalidatePermissionCache: vi.fn(),
}));

vi.mock('../prisma', () => ({
  prisma: {
    menu: {
      create: mocks.create,
      findUnique: mocks.findUniqueMenu,
    },
    permission: {
      findUnique: mocks.findUniquePermission,
    },
  },
}));

vi.mock('../permission-cache', () => ({
  invalidatePermissionCache: mocks.invalidatePermissionCache,
}));

const { createMenu } = await import('../../src/modules/menus/service');

describe('menu service validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires LINK menus to keep their external destination in externalUrl', async () => {
    const data = menuCreateInputSchema.parse({
      name: '项目文档',
      path: '/admin/docs',
      type: 'LINK',
      externalUrl: null,
    });

    await expect(createMenu(data)).rejects.toMatchObject({
      message: 'LINK 类型菜单必须设置外链地址',
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('creates a LINK menu with an admin path and a separate destination', async () => {
    const data = menuCreateInputSchema.parse({
      name: '项目文档',
      path: '/admin/docs',
      type: 'LINK',
      externalUrl: 'https://example.com/docs',
    });

    await expect(createMenu(data)).resolves.toEqual(data);
    expect(mocks.create).toHaveBeenCalledWith({ data });
    expect(mocks.invalidatePermissionCache).toHaveBeenCalledOnce();
  });
});
