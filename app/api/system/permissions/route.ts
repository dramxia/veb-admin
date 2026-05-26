export const dynamic = 'force-dynamic';

import { Prisma } from '@prisma/client';
import { ok, parsePage, readJson, withApi } from '@/lib/api';
import { ConflictError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { permissionSchema } from '@/lib/validation';

export const GET = withApi(async (request: Request) => {
  await requirePermission('system:permission:view');
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip } = parsePage(searchParams);
  const keyword = searchParams.get('keyword')?.trim();
  const type = searchParams.get('type') || undefined;
  const where: Prisma.PermissionWhereInput = {
    ...(type ? { type: type as Prisma.EnumPermissionTypeFilter['equals'] } : {}),
    ...(keyword ? { OR: [{ code: { contains: keyword } }, { name: { contains: keyword } }] } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.permission.count({ where }),
    prisma.permission.findMany({ where, skip, take: pageSize, orderBy: [{ type: 'asc' }, { code: 'asc' }] }),
  ]);
  return ok({ items, total, page, pageSize });
});

export const POST = withApi(async (request: Request) => {
  await requirePermission('system:permission:create');
  const data = await readJson(request, permissionSchema);
  const exists = await prisma.permission.findUnique({ where: { code: data.code } });
  if (exists) throw new ConflictError('权限码已存在');
  const permission = await prisma.permission.create({ data });
  invalidatePermissionCache();
  return ok(permission);
}, { action: 'permission.create' });
