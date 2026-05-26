export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { ConflictError, NotFoundError, ParamError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { assignPermissionsSchema } from '@/lib/validation';

export const POST = withApi(async (request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:role:assign-permission');
  const role = await prisma.role.findUnique({ where: { id: params.id } });
  if (!role) throw new NotFoundError('角色不存在');
  if (role.isSystem && role.code === 'superadmin') throw new ConflictError('超级管理员不可修改权限');

  const data = await readJson(request, assignPermissionsSchema);
  const permissionIds = [...new Set(data.permissionIds)];
  const permissionCount = permissionIds.length
    ? await prisma.permission.count({ where: { id: { in: permissionIds } } })
    : 0;
  if (permissionCount !== permissionIds.length) throw new ParamError('权限不存在');

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: params.id } });
    if (permissionIds.length) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: params.id, permissionId })),
        skipDuplicates: true,
      });
    }
  });
  invalidatePermissionCache();
  return ok({ id: params.id, permissionIds });
}, { action: 'role.assign-permission', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });
