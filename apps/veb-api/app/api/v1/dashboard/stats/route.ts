export const dynamic = 'force-dynamic';

import { ok, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { getDashboardStats } from '@/src/modules/dashboard/service';

export const GET = withApi(async () => {
  await requirePermission('dashboard:view');
  return ok(await getDashboardStats());
});
