export const dynamic = 'force-dynamic';

import { Prisma } from '@prisma/client';
import { ok, readJson, withApi } from '@/lib/api';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { roleUpdateSchema } from '@/lib/validation';

const systemRoleCodes = ['superadmin', 'admin', 'user'];

export const GET = withApi(async (_request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:role:view');
  const role = await prisma.role.findUnique({ where: { id: params.id }, include: { permissions: { include: { permission: true } }, users: { include: { user: true } } } });
  if (!role) throw new NotFoundError('角色不存在');
  return ok(role);
});

export const PATCH = withApi(async (request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:role:update');
  const old = await prisma.role.findUnique({ where: { id: params.id } });
  if (!old) throw new NotFoundError('角色不存在');
  const data = await readJson(request, roleUpdateSchema);
  if (old.isSystem) delete data.code;
  const role = await prisma.role.update({ where: { id: params.id }, data });
  invalidatePermissionCache();
  return ok(role);
}, { action: 'role.update', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });

export const DELETE = withApi(async (_request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:role:delete');
  const role = await prisma.role.findUnique({ where: { id: params.id }, include: { _count: { select: { users: true } } } });
  if (!role) throw new NotFoundError('角色不存在');
  if (role.isSystem || systemRoleCodes.includes(role.code)) throw new ConflictError('内置角色不可删除');
  if (role._count.users > 0) throw new ConflictError('角色已关联用户，不能删除');
  await prisma.role.delete({ where: { id: params.id } });
  invalidatePermissionCache();
  return ok({ id: params.id });
}, { action: 'role.delete', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });
