export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { fail, ok } from '@/lib/api';
import { ERROR_CODES } from '@/lib/errors';
import { attachRequestId, getRequestId } from '@/lib/request-id';
import { getReadinessStatus } from '@/src/modules/health/service';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    return attachRequestId(ok(await getReadinessStatus(requestId)), requestId);
  } catch (error) {
    console.error(
      '[readiness:error]',
      error instanceof Error
        ? { name: error.name, message: error.message }
        : error,
    );
    return attachRequestId(
      fail(ERROR_CODES.SERVICE_UNAVAILABLE, 'VEB API 尚未就绪', 503),
      requestId,
    );
  }
}
