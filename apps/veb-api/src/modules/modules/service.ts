import type { z } from 'zod';
import type { AppModuleListQuery as AppModuleListContractQuery } from '@veb/api-contracts';
import { isPrismaKnownRequestError } from '@veb/api-kit';
import { Prisma } from '@/generated/client';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { withSerializableRetry } from '@/lib/prisma-transaction';
import { appModuleSchema, appModuleUpdateSchema } from '@/lib/validation';

type AppModuleCreateData = z.infer<typeof appModuleSchema>;
type AppModuleUpdateData = z.infer<typeof appModuleUpdateSchema>;

type AppModuleListQuery = AppModuleListContractQuery & {
  skip: number;
};

const moduleSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  icon: true,
  sort: true,
  status: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { roles: true } },
} satisfies Prisma.AppModuleSelect;

type SelectedAppModule = Prisma.AppModuleGetPayload<{
  select: typeof moduleSelect;
}>;

type MenuCounts = { menus: number; buttons: number };

const moduleDeleteSelect = {
  isSystem: true,
  _count: { select: { menus: true, roles: true } },
} satisfies Prisma.AppModuleSelect;

async function getMenuCounts(moduleIds: string[]) {
  const counts = new Map<string, MenuCounts>();
  if (!moduleIds.length) return counts;

  const rows = await prisma.menu.groupBy({
    by: ['moduleId', 'type'],
    where: { moduleId: { in: moduleIds } },
    _count: { _all: true },
  });
  for (const row of rows) {
    const current = counts.get(row.moduleId) ?? { menus: 0, buttons: 0 };
    if (row.type === 'BUTTON') current.buttons += row._count._all;
    else current.menus += row._count._all;
    counts.set(row.moduleId, current);
  }
  return counts;
}

function resolveModule(record: SelectedAppModule, counts?: MenuCounts) {
  return {
    ...record,
    _count: {
      menus: counts?.menus ?? 0,
      buttons: counts?.buttons ?? 0,
      roles: record._count.roles,
    },
  };
}

function rethrowModuleWriteError(error: unknown): never {
  if (isPrismaKnownRequestError(error, 'P2002'))
    throw new ConflictError('模块编码已存在');
  if (isPrismaKnownRequestError(error, 'P2003'))
    throw new ConflictError('模块已关联角色或菜单，不能删除');
  if (isPrismaKnownRequestError(error, 'P2025'))
    throw new NotFoundError('模块不存在');
  throw error;
}

export async function listAppModules({
  page,
  pageSize,
  skip,
  keyword,
  status,
}: AppModuleListQuery) {
  const where: Prisma.AppModuleWhereInput = {
    ...(status
      ? { status: status as Prisma.EnumCommonStatusFilter['equals'] }
      : {}),
    ...(keyword
      ? {
          OR: [
            { code: { contains: keyword } },
            { name: { contains: keyword } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.appModule.count({ where }),
    prisma.appModule.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ sort: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      select: moduleSelect,
    }),
  ]);
  const menuCounts = await getMenuCounts(items.map((item) => item.id));
  return {
    items: items.map((item) => resolveModule(item, menuCounts.get(item.id))),
    total,
    page,
    pageSize,
  };
}

export async function createAppModule(data: AppModuleCreateData) {
  try {
    const record = await prisma.appModule.create({
      data,
      select: moduleSelect,
    });
    return resolveModule(record);
  } catch (error) {
    rethrowModuleWriteError(error);
  }
}

export async function getAppModule(id: string) {
  const record = await prisma.appModule.findUnique({
    where: { id },
    select: moduleSelect,
  });
  if (!record) throw new NotFoundError('模块不存在');
  const counts = await getMenuCounts([id]);
  return resolveModule(record, counts.get(id));
}

export async function updateAppModule(id: string, data: AppModuleUpdateData) {
  try {
    const record = await withSerializableRetry(async (tx) => {
      const old = await tx.appModule.findUnique({
        where: { id },
        select: moduleSelect,
      });
      if (!old) throw new NotFoundError('模块不存在');

      const safeData = old.isSystem
        ? { name: data.name, icon: data.icon, sort: data.sort }
        : data;
      if (
        old.isSystem &&
        ((data.status !== undefined && data.status !== 'ENABLED') ||
          (data.description !== undefined &&
            data.description !== old.description))
      ) {
        throw new ConflictError('内置模块只允许修改名称、图标和排序');
      }
      return tx.appModule.update({
        where: { id },
        data: safeData,
        select: moduleSelect,
      });
    });
    const counts = await getMenuCounts([id]);
    return resolveModule(record, counts.get(id));
  } catch (error) {
    rethrowModuleWriteError(error);
  }
}

export async function deleteAppModule(id: string) {
  try {
    await withSerializableRetry(async (tx) => {
      const record = await tx.appModule.findUnique({
        where: { id },
        select: moduleDeleteSelect,
      });
      if (!record) throw new NotFoundError('模块不存在');
      if (record.isSystem) throw new ConflictError('内置模块不可删除');
      if (record._count.menus > 0 || record._count.roles > 0)
        throw new ConflictError('模块已关联角色或菜单，不能删除');
      await tx.appModule.delete({ where: { id } });
    });
    return { id };
  } catch (error) {
    rethrowModuleWriteError(error);
  }
}
