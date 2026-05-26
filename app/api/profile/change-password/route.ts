export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import { ok, readJson, withApi } from '@/lib/api';
import { AuthError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertRateLimit, getClientIp } from '@/lib/rate-limit';
import { requireUser } from '@/lib/session';
import { changePasswordSchema } from '@/lib/validation';

export const POST = withApi(async (request: Request) => {
  assertRateLimit({ key: `change-password:${getClientIp(request)}`, capacity: 10, windowMs: 5000 });
  const sessionUser = await requireUser();
  const data = await readJson(request, changePasswordSchema);
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) throw new AuthError();
  const valid = await bcrypt.compare(data.oldPassword, user.passwordHash);
  if (!valid) throw new AuthError('原密码不正确');
  const passwordHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return ok({ id: user.id });
}, { action: 'profile.change-password' });
