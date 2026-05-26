export const dynamic = 'force-dynamic';

import { ok, withApi } from '@/lib/api';
import { getUserMenuAndPermissions } from '@/lib/menu';
import { requireUser } from '@/lib/session';

export const GET = withApi(async () => {
  const user = await requireUser();
  const payload = await getUserMenuAndPermissions(user.id);
  return ok(payload);
});
