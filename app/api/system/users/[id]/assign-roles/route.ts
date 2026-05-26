export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { NotFoundError, ParamError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { assignRolesSchema } from '@/lib/validation';

export const POST = withApi(async (request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:user:assign-role');
  const data = await readJson(request, assignRolesSchema);
  const roleIds = [...new Set(data.roleIds)];

  const [user, roleCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: params.id }, select: { id: true } }),
    roleIds.length ? prisma.role.count({ where: { id: { in: roleIds } } }) : Promise.resolve(0),
  ]);
  if (!user) throw new NotFoundError('用户不存在');
  if (roleCount !== roleIds.length) throw new ParamError('角色不存在');

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId: params.id } });
    if (roleIds.length) {
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId: params.id, roleId })),
        skipDuplicates: true,
      });
    }
  });
  invalidatePermissionCache(params.id);
  return ok({ id: params.id, roleIds });
}, { action: 'user.assign-role', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });
