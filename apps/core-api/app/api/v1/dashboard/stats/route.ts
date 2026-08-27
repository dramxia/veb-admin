export const dynamic = 'force-dynamic';

import { ok, defineApiRoute } from '@/lib/api';
import { getDashboardStats } from '@/src/modules/dashboard/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'dashboard:view' },
  async () => {
    return ok(await getDashboardStats());
  },
);
