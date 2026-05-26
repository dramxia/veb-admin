export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { permissionUpdateSchema } from '@/lib/validation';

export const GET = withApi(async (_request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:permission:view');
  const permission = await prisma.permission.findUnique({ where: { id: params.id } });
  if (!permission) throw new NotFoundError('权限不存在');
  return ok(permission);
});

export const PATCH = withApi(async (request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:permission:update');
  const old = await prisma.permission.findUnique({ where: { id: params.id } });
  if (!old) throw new NotFoundError('权限不存在');
  const data = await readJson(request, permissionUpdateSchema);
  if (old.isSystem) delete data.code;
  const permission = await prisma.permission.update({ where: { id: params.id }, data });
  invalidatePermissionCache();
  return ok(permission);
}, { action: 'permission.update', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });

export const DELETE = withApi(async (_request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:permission:delete');
  const permission = await prisma.permission.findUnique({ where: { id: params.id } });
  if (!permission) throw new NotFoundError('权限不存在');
  if (permission.isSystem) throw new ConflictError('内置权限不可删除');
  await prisma.permission.delete({ where: { id: params.id } });
  invalidatePermissionCache();
  return ok({ id: params.id });
}, { action: 'permission.delete', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });
