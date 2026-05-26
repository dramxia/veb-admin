export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { NotFoundError, ParamError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { assignUsersSchema } from '@/lib/validation';

export const POST = withApi(async (request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:role:assign-user');
  const data = await readJson(request, assignUsersSchema);
  const userIds = [...new Set(data.userIds)];

  const [role, userCount] = await Promise.all([
    prisma.role.findUnique({ where: { id: params.id }, select: { id: true } }),
    userIds.length ? prisma.user.count({ where: { id: { in: userIds } } }) : Promise.resolve(0),
  ]);
  if (!role) throw new NotFoundError('角色不存在');
  if (userCount !== userIds.length) throw new ParamError('用户不存在');

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { roleId: params.id } });
    if (userIds.length) {
      await tx.userRole.createMany({
        data: userIds.map((userId) => ({ userId, roleId: params.id })),
        skipDuplicates: true,
      });
    }
  });
  invalidatePermissionCache();
  return ok({ id: params.id, userIds });
}, { action: 'role.assign-user', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });
