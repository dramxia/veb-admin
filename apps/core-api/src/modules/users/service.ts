import type { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { UserListQuery as UserListContractQuery } from '@veb/api-contracts';
import { isPrismaKnownRequestError } from '@/lib/api-kit';
import { Prisma } from '@/generated/client';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { userCreateSchema, userUpdateSchema } from '@/lib/validation';
import { assertRolesAssignable } from '@/src/modules/role-assignment/policy';

type UserCreateData = z.infer<typeof userCreateSchema>;
type UserUpdateData = z.infer<typeof userUpdateSchema>;

type UserListQuery = UserListContractQuery & {
  skip: number;
};

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
} satisfies Prisma.UserSelect;

export async function listUsers({
  page,
  pageSize,
  skip,
  keyword,
  status,
}: UserListQuery) {
  const where: Prisma.UserWhereInput = {
    ...(status
      ? { status: status as Prisma.EnumUserStatusFilter['equals'] }
      : {}),
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
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: userSelect,
    }),
  ]);
  return { items, total, page, pageSize };
}

export async function createUser(actorId: string, data: UserCreateData) {
  const exists = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (exists) throw new ConflictError('用户名已存在');

  await assertRolesAssignable(actorId, data.roleIds ?? []);

  const passwordHash = await bcrypt.hash(data.password, 12);
  return prisma.user.create({
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
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
  if (!user) throw new NotFoundError('用户不存在');
  return user;
}

export async function updateUser(id: string, data: UserUpdateData) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
    return user;
  } catch (error) {
    if (isPrismaKnownRequestError(error, 'P2025')) {
      throw new NotFoundError('用户不存在');
    }
    if (isPrismaKnownRequestError(error, 'P2002')) {
      throw new ConflictError('用户名或邮箱已存在');
    }
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    return { id };
  } catch (error) {
    if (isPrismaKnownRequestError(error, 'P2025')) {
      throw new NotFoundError('用户不存在');
    }
    if (isPrismaKnownRequestError(error, 'P2003')) {
      throw new ConflictError('该用户仍有关联文章，无法删除');
    }
    throw error;
  }
}

export async function assignUserRoles(
  actorId: string,
  id: string,
  requestedRoleIds: string[],
) {
  const roleIds = [...new Set(requestedRoleIds)];
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, roles: { select: { roleId: true } } },
  });
  if (!user) throw new NotFoundError('用户不存在');
  await assertRolesAssignable(actorId, [
    ...roleIds,
    ...user.roles.map((assignment) => assignment.roleId),
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId: id } });
    if (roleIds.length) {
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId: id, roleId })),
        skipDuplicates: true,
      });
    }
  });
  return { id, roleIds };
}

export async function resetUserPassword(id: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!user) throw new NotFoundError('用户不存在');

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  return { id };
}
