export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { ok, parsePage, readJson, withApi } from '@/lib/api';
import { ConflictError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { userCreateSchema } from '@/lib/validation';

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

export const GET = withApi(async (request: Request) => {
  await requirePermission('system:user:view');
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip } = parsePage(searchParams);
  const keyword = searchParams.get('keyword')?.trim();
  const status = searchParams.get('status') || undefined;

  const where: Prisma.UserWhereInput = {
    ...(status ? { status: status as Prisma.EnumUserStatusFilter['equals'] } : {}),
    ...(keyword
      ? {
          OR: [
            { username: { contains: keyword, mode: 'insensitive' } },
            { nickname: { contains: keyword, mode: 'insensitive' } },
            { email: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' }, select: userSelect }),
  ]);
  return ok({ items, total, page, pageSize });
});

export const POST = withApi(async (request: Request) => {
  await requirePermission('system:user:create');
  const data = await readJson(request, userCreateSchema);

  const exists = await prisma.user.findUnique({ where: { username: data.username } });
  if (exists) throw new ConflictError('用户名已存在');

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      username: data.username,
      passwordHash,
      email: data.email,
      nickname: data.nickname,
      avatar: data.avatar,
      status: data.status,
      roles: data.roleIds?.length
        ? { create: data.roleIds.map((roleId) => ({ roleId })) }
        : undefined,
    },
    select: userSelect,
  });
  return ok(user);
}, { action: 'user.create' });
