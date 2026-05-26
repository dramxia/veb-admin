export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { profileSchema } from '@/lib/validation';

export const PATCH = withApi(async (request: Request) => {
  const user = await requireUser();
  const data = await readJson(request, profileSchema);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, username: true, nickname: true, email: true, avatar: true },
  });
  return ok(updated);
}, { action: 'profile.update' });
