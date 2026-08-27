import { handlers } from '@/lib/auth';
import { logApiAccess } from '@/lib/access-log';
import { attachRequestId, getRequestId } from '@/lib/request-id';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request);
  const response = attachRequestId(await handlers.GET(request), requestId);
  logApiAccess('core-api', request, response, requestId, startedAt);
  return response;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request);
  const response = attachRequestId(await handlers.POST(request), requestId);
  logApiAccess('core-api', request, response, requestId, startedAt);
  return response;
}
