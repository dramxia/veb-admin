export const dynamic = 'force-dynamic';

import { Prisma } from '@prisma/client';
import { ok, readJson, withApi } from '@/lib/api';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { userUpdateSchema } from '@/lib/validation';

const userSelect = {
  id: true,
  username: true,
  email: true,
  nickname: true,
  avatar: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  roles: { select: { role: { select: { id: true, code: true, name: true } } } },
};

export const GET = withApi(async (_request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:user:view');
  const user = await prisma.user.findUnique({ where: { id: params.id }, select: userSelect });
  if (!user) throw new NotFoundError('用户不存在');
  return ok(user);
});

export const PATCH = withApi(async (request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:user:update');
  const data = await readJson(request, userUpdateSchema);
  try {
    const user = await prisma.user.update({ where: { id: params.id }, data, select: userSelect });
    invalidatePermissionCache(params.id);
    return ok(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundError('用户不存在');
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('用户名或邮箱已存在');
    }
    throw error;
  }
}, { action: 'user.update', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });

export const DELETE = withApi(async (_request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:user:delete');
  await prisma.user.delete({ where: { id: params.id } });
  invalidatePermissionCache(params.id);
  return ok({ id: params.id });
}, { action: 'user.delete', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });
