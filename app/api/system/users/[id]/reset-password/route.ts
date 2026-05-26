export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import { ok, readJson, withApi } from '@/lib/api';
import { NotFoundError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { resetPasswordSchema } from '@/lib/validation';

export const POST = withApi(async (request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:user:reset-password');
  const data = await readJson(request, resetPasswordSchema);
  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!user) throw new NotFoundError('用户不存在');

  const passwordHash = await bcrypt.hash(data.password, 12);
  await prisma.user.update({ where: { id: params.id }, data: { passwordHash } });
  invalidatePermissionCache(params.id);
  return ok({ id: params.id });
}, { action: 'user.reset-password', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });
