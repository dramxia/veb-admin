export const dynamic = 'force-dynamic';

import { defineApiRoute, ok } from '@/lib/api';
import { getHealthStatus } from '@/src/modules/health/service';

export const GET = defineApiRoute({ access: 'public' }, async () =>
  ok(await getHealthStatus()),
);
