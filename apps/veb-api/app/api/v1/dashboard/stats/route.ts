export const dynamic = 'force-dynamic';

import { ok, withApi } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { getDashboardStats } from '@/src/modules/dashboard/service';

export const GET = withApi(async () => {
  await requireUser();
  return ok(await getDashboardStats());
});
