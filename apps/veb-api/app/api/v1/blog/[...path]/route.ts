export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { logApiAccess } from '@/lib/access-log';
import { proxyBlogRequest } from '@/src/modules/blog-bff/service';

type RouteContext = { params: { path: string[] } };

async function proxy(request: Request, { params }: RouteContext) {
  const startedAt = Date.now();
  const response = await proxyBlogRequest(request, params.path);
  logApiAccess(
    'veb-api',
    request,
    response,
    response.headers.get('x-request-id') || 'unknown',
    startedAt,
  );
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
