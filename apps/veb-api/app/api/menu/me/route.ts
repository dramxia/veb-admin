export const dynamic = 'force-dynamic';

import { ok, withApi } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { getUserMenuAndPermissions } from '@/src/modules/navigation/service';

export const GET = withApi(async () => {
  const user = await requireUser();
  const payload = await getUserMenuAndPermissions(user.id);
  return ok(payload);
});
