export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { handleApiError } from '@/lib/api';
import { attachRequestId, getRequestId } from '@/lib/request-id';
import { getJwksResponse } from '@/src/modules/service-auth/jwks';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    return attachRequestId(await getJwksResponse(), requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
