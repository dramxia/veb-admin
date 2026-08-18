export const dynamic = 'force-dynamic';

import { fail, ok } from '@/lib/api';
import { ERROR_CODES } from '@/lib/errors';
import { attachRequestId, getRequestId } from '@/lib/request-id';
import { getHealthStatus } from '@/src/modules/health/service';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    return attachRequestId(ok(await getHealthStatus()), requestId);
  } catch (error) {
    console.error('[health:error]', error);
    return attachRequestId(
      fail(ERROR_CODES.SERVICE_UNAVAILABLE, 'VEB 数据库不可用', 503),
      requestId,
    );
  }
}
