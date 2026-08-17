export const dynamic = 'force-dynamic';

import { ok, withApi } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { getUserNavigation } from '@/src/modules/navigation/service';

export const GET = withApi(async () => {
  const user = await requireUser();
  return ok(await getUserNavigation(user.id));
});
