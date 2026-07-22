import type { z } from 'zod';
import type { RoleListQuery as RoleListContractQuery } from '@veb/api-contracts';
import { Prisma } from '@/generated/client';
import { ConflictError, NotFoundError, ParamError } from '@/lib/errors';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { roleSchema, roleUpdateSchema } from '@/lib/validation';

type RoleCreateData = z.infer<typeof roleSchema>;
type RoleUpdateData = z.infer<typeof roleUpdateSchema>;

type RoleListQuery = RoleListContractQuery & {
  skip: number;
};

const systemRoleCodes = ['superadmin', 'admin', 'user'];

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
} satisfies Prisma.RoleSelect;

export async function listRoles({
  page,
  pageSize,
  skip,
  keyword,
  status,
}: RoleListQuery) {
  const where: Prisma.RoleWhereInput = {
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
    prisma.role.count({ where }),
    prisma.role.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      select: roleSelect,
    }),
  ]);
  return { items, total, page, pageSize };
}

export async function createRole(data: RoleCreateData) {
  const exists = await prisma.role.findUnique({ where: { code: data.code } });
  if (exists) throw new ConflictError('角色编码已存在');
  return prisma.role.create({ data, select: roleSelect });
}

export async function getRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } },
      users: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              nickname: true,
              avatar: true,
              status: true,
              lastLoginAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });
  if (!role) throw new NotFoundError('角色不存在');
  return role;
}

export async function updateRole(id: string, data: RoleUpdateData) {
  const old = await prisma.role.findUnique({ where: { id } });
  if (!old) throw new NotFoundError('角色不存在');
  const safeData = old.isSystem ? { ...data, code: undefined } : data;
  const role = await prisma.role.update({ where: { id }, data: safeData });
  invalidatePermissionCache();
  return role;
}

export async function deleteRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) throw new NotFoundError('角色不存在');
  if (role.isSystem || systemRoleCodes.includes(role.code))
    throw new ConflictError('内置角色不可删除');
  if (role._count.users > 0)
    throw new ConflictError('角色已关联用户，不能删除');
  await prisma.role.delete({ where: { id } });
  invalidatePermissionCache();
  return { id };
}

export async function assignRolePermissions(
  id: string,
  requestedPermissionIds: string[],
) {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new NotFoundError('角色不存在');
  if (role.isSystem && role.code === 'superadmin')
    throw new ConflictError('超级管理员不可修改权限');

  const permissionIds = [...new Set(requestedPermissionIds)];
  const permissionCount = permissionIds.length
    ? await prisma.permission.count({ where: { id: { in: permissionIds } } })
    : 0;
  if (permissionCount !== permissionIds.length)
    throw new ParamError('权限不存在');

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: id } });
    if (permissionIds.length) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }
  });
  invalidatePermissionCache();
  return { id, permissionIds };
}

export async function assignRoleUsers(id: string, requestedUserIds: string[]) {
  const userIds = [...new Set(requestedUserIds)];
  const [role, userCount] = await Promise.all([
    prisma.role.findUnique({ where: { id }, select: { id: true } }),
    userIds.length
      ? prisma.user.count({ where: { id: { in: userIds } } })
      : Promise.resolve(0),
  ]);
  if (!role) throw new NotFoundError('角色不存在');
  if (userCount !== userIds.length) throw new ParamError('用户不存在');

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { roleId: id } });
    if (userIds.length) {
      await tx.userRole.createMany({
        data: userIds.map((userId) => ({ userId, roleId: id })),
        skipDuplicates: true,
      });
    }
  });
  invalidatePermissionCache();
  return { id, userIds };
}
