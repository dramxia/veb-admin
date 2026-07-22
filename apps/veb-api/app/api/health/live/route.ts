export const dynamic = 'force-dynamic';

import { ok } from '@/lib/api';
import { attachRequestId, getRequestId } from '@/lib/request-id';
import { getLivenessStatus } from '@/src/modules/health/service';

export function GET(request: Request) {
  const requestId = getRequestId(request);
  return attachRequestId(ok(getLivenessStatus()), requestId);
}
