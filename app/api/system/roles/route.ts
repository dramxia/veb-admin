export const dynamic = 'force-dynamic';

import { Prisma } from '@prisma/client';
import { ok, parsePage, readJson, withApi } from '@/lib/api';
import { ConflictError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { roleSchema } from '@/lib/validation';

const roleSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  status: true,
  sort: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { users: true, permissions: true } },
};

export const GET = withApi(async (request: Request) => {
  await requirePermission('system:role:view');
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip } = parsePage(searchParams);
  const keyword = searchParams.get('keyword')?.trim();
  const status = searchParams.get('status') || undefined;
  const where: Prisma.RoleWhereInput = {
    ...(status ? { status: status as Prisma.EnumCommonStatusFilter['equals'] } : {}),
    ...(keyword ? { OR: [{ code: { contains: keyword } }, { name: { contains: keyword } }] } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.role.count({ where }),
    prisma.role.findMany({ where, skip, take: pageSize, orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }], select: roleSelect }),
  ]);
  return ok({ items, total, page, pageSize });
});

export const POST = withApi(async (request: Request) => {
  await requirePermission('system:role:create');
  const data = await readJson(request, roleSchema);
  const exists = await prisma.role.findUnique({ where: { code: data.code } });
  if (exists) throw new ConflictError('角色编码已存在');
  const role = await prisma.role.create({ data, select: roleSelect });
  return ok(role);
}, { action: 'role.create' });
