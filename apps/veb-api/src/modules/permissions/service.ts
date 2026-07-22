import type { z } from 'zod';
import type { PermissionListQuery as PermissionListContractQuery } from '@veb/api-contracts';
import { Prisma } from '@/generated/client';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { permissionSchema, permissionUpdateSchema } from '@/lib/validation';

type PermissionCreateData = z.infer<typeof permissionSchema>;
type PermissionUpdateData = z.infer<typeof permissionUpdateSchema>;

type PermissionListQuery = PermissionListContractQuery & {
  skip: number;
};

export async function listPermissions({
  page,
  pageSize,
  skip,
  keyword,
  type,
}: PermissionListQuery) {
  const where: Prisma.PermissionWhereInput = {
    ...(type
      ? { type: type as Prisma.EnumPermissionTypeFilter['equals'] }
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
    prisma.permission.count({ where }),
    prisma.permission.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    }),
  ]);
  return { items, total, page, pageSize };
}

export async function createPermission(data: PermissionCreateData) {
  const exists = await prisma.permission.findUnique({
    where: { code: data.code },
  });
  if (exists) throw new ConflictError('权限码已存在');
  const permission = await prisma.permission.create({ data });
  invalidatePermissionCache();
  return permission;
}

export async function getPermission(id: string) {
  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) throw new NotFoundError('权限不存在');
  return permission;
}

export async function updatePermission(id: string, data: PermissionUpdateData) {
  const old = await prisma.permission.findUnique({ where: { id } });
  if (!old) throw new NotFoundError('权限不存在');
  const safeData = old.isSystem ? { ...data, code: undefined } : data;
  const permission = await prisma.permission.update({
    where: { id },
    data: safeData,
  });
  invalidatePermissionCache();
  return permission;
}

export async function deletePermission(id: string) {
  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) throw new NotFoundError('权限不存在');
  if (permission.isSystem) throw new ConflictError('内置权限不可删除');
  await prisma.permission.delete({ where: { id } });
  invalidatePermissionCache();
  return { id };
}
