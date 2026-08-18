import { NextResponse, type NextRequest } from 'next/server';

type ApiEnvelope<T> = {
  code: number;
  data: T | null;
};

type NavigationResponse = {
  modules: Array<{
    code: string;
    landingPath: string;
  }>;
};

const VEB_API_INTERNAL_URL =
  process.env.VEB_API_INTERNAL_URL || 'http://127.0.0.1:1067';

const GLOBAL_PATHS = new Set(['/login', '/profile', '/403', '/404']);

function isPublicOrGlobalPath(pathname: string) {
  return (
    GLOBAL_PATHS.has(pathname) ||
    pathname === '/articles' ||
    pathname.startsWith('/articles/')
  );
}

async function requestVebApi(
  request: NextRequest,
  path: string,
  requestId: string,
) {
  const headers = new Headers({
    accept: 'application/json',
    'x-request-id': requestId,
  });
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  try {
    return await fetch(new URL(path, VEB_API_INTERNAL_URL), {
      cache: 'no-store',
      headers,
    });
  } catch {
    // The server-rendered page remains the source of truth if the early probe
    // cannot reach the API during startup or a transient outage.
    return null;
  }
}

function redirectResponse(
  request: NextRequest,
  pathname: string,
  status: 307 | 308 = 307,
) {
  const publicOrigin = process.env.AUTH_URL || request.nextUrl.origin;
  return NextResponse.redirect(new URL(pathname, publicOrigin), status);
}

function rewriteResponse(
  request: NextRequest,
  pathname: '/403' | '/404',
  status: 403 | 404,
  requestHeaders: Headers,
) {
  const destination = request.nextUrl.clone();
  destination.pathname = pathname;
  destination.search = '';
  return NextResponse.rewrite(destination, {
    request: { headers: requestHeaders },
    status,
  });
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId = requestHeaders.get('x-request-id') || crypto.randomUUID();
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-veb-pathname', request.nextUrl.pathname);

  const pathname = request.nextUrl.pathname;
  let response: NextResponse;

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else if (pathname === '/admin') {
    const navigationResponse = await requestVebApi(
      request,
      '/api/v1/navigation',
      requestId,
    );
    if (navigationResponse?.status === 401) {
      response = redirectResponse(request, '/login');
    } else if (navigationResponse?.ok) {
      const payload = (await navigationResponse
        .json()
        .catch(() => null)) as ApiEnvelope<NavigationResponse> | null;
      const modules = Array.isArray(payload?.data?.modules)
        ? payload.data.modules
        : [];
      const adminModule = modules.find((module) => module.code === 'admin');
      const destination = adminModule?.landingPath;
      response = destination
        ? redirectResponse(request, destination)
        : rewriteResponse(request, '/403', 403, requestHeaders);
    } else {
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
  } else if (pathname === '/') {
    const navigationResponse = await requestVebApi(
      request,
      '/api/v1/navigation',
      requestId,
    );
    if (navigationResponse?.status === 401) {
      response = redirectResponse(request, '/login');
    } else if (navigationResponse?.ok) {
      const payload = (await navigationResponse
        .json()
        .catch(() => null)) as ApiEnvelope<NavigationResponse> | null;
      const modules = Array.isArray(payload?.data?.modules)
        ? payload.data.modules
        : [];
      const destination = modules[0]?.landingPath;
      response = destination
        ? redirectResponse(request, destination)
        : NextResponse.next({ request: { headers: requestHeaders } });
    } else {
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
  } else if (!isPublicOrGlobalPath(pathname)) {
    const query = new URLSearchParams({ path: pathname });
    const pageResponse = await requestVebApi(
      request,
      `/api/v1/navigation/page?${query.toString()}`,
      requestId,
    );

    if (pageResponse?.status === 401) {
      response = redirectResponse(request, '/login');
    } else if (pageResponse?.status === 403) {
      response = rewriteResponse(request, '/403', 403, requestHeaders);
    } else if (pageResponse?.status === 404) {
      response = rewriteResponse(request, '/404', 404, requestHeaders);
    } else {
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
  } else {
    response = NextResponse.next({
      request: { headers: requestHeaders },
      status: pathname === '/403' ? 403 : pathname === '/404' ? 404 : undefined,
    });
  }

  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
