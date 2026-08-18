import {
  ERROR_CODES,
  REQUEST_ID_HEADER,
  createApiError,
} from '@veb/api-contracts';
import { randomUUID } from 'node:crypto';

const PUBLIC_BLOG_PREFIXES = ['/api/v1/public'] as const;
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

type ProxyEnvironment = {
  VEB_API_INTERNAL_URL?: string;
  BLOG_API_INTERNAL_URL?: string;
  WEB_TRUST_PROXY_HEADERS?: string;
};

type ProxyFetch = typeof fetch;
type NodeRequestInit = RequestInit & { duplex?: 'half' };
type RequestWithClientIp = Request & { readonly ip?: string };

export type ApiProxyOptions = {
  env?: ProxyEnvironment;
  fetch?: ProxyFetch;
};

function hasPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isBlogPublicPath(pathname: string) {
  return PUBLIC_BLOG_PREFIXES.some((prefix) => hasPathPrefix(pathname, prefix));
}

function readUpstreamUrl(
  rawValue: string | undefined,
  fallback: string,
  variableName: string,
) {
  const url = new URL(rawValue?.trim() || fallback);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError(`${variableName} must use http or https`);
  }
  return url;
}

export function resolveApiUpstream(
  pathname: string,
  env: ProxyEnvironment = process.env as ProxyEnvironment,
) {
  if (isBlogPublicPath(pathname)) {
    return readUpstreamUrl(
      env.BLOG_API_INTERNAL_URL,
      'http://127.0.0.1:1068',
      'BLOG_API_INTERNAL_URL',
    );
  }
  return readUpstreamUrl(
    env.VEB_API_INTERNAL_URL,
    'http://127.0.0.1:1067',
    'VEB_API_INTERNAL_URL',
  );
}

function copyHeaders(source: Headers) {
  const headers = new Headers();
  source.forEach((value, name) => {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      headers.append(name, value);
    }
  });
  return headers;
}

function requestHeaders(
  request: Request,
  requestId: string,
  env: ProxyEnvironment,
) {
  const headers = copyHeaders(request.headers);
  const originalHost = request.headers.get('host');
  const requestUrl = new URL(request.url);
  const trustProxyHeaders = env.WEB_TRUST_PROXY_HEADERS === 'true';
  const clientIp =
    (request as RequestWithClientIp).ip?.trim() ||
    (trustProxyHeaders
      ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      : undefined);
  const trustedProto = trustProxyHeaders
    ? request.headers.get('x-forwarded-proto')?.trim().toLowerCase()
    : undefined;

  headers.delete('cf-connecting-ip');
  headers.delete('forwarded');
  headers.delete('x-forwarded-for');
  headers.delete('x-real-ip');
  if (clientIp) {
    headers.set('x-forwarded-for', clientIp);
    headers.set('x-real-ip', clientIp);
  }
  headers.set('x-forwarded-host', originalHost || requestUrl.host);
  headers.set(
    'x-forwarded-proto',
    trustedProto === 'http' || trustedProto === 'https'
      ? trustedProto
      : requestUrl.protocol.slice(0, -1),
  );
  headers.set('accept-encoding', 'identity');
  headers.set(REQUEST_ID_HEADER, requestId);
  return headers;
}

function responseHeaders(response: Response, requestId: string) {
  const headers = copyHeaders(response.headers);
  headers.delete('set-cookie');

  const headersWithCookies = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const cookies = headersWithCookies.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    for (const cookie of cookies) headers.append('set-cookie', cookie);
  } else {
    const cookie = response.headers.get('set-cookie');
    if (cookie) headers.append('set-cookie', cookie);
  }

  headers.set(
    REQUEST_ID_HEADER,
    response.headers.get(REQUEST_ID_HEADER) || requestId,
  );
  return headers;
}

function serviceUnavailable(requestId: string) {
  return Response.json(
    createApiError(ERROR_CODES.SERVICE_UNAVAILABLE, '上游服务暂时不可用'),
    {
      status: 503,
      headers: { [REQUEST_ID_HEADER]: requestId },
    },
  );
}

export async function proxyApiRequest(
  request: Request,
  options: ApiProxyOptions = {},
) {
  const requestUrl = new URL(request.url);
  const requestId =
    request.headers.get(REQUEST_ID_HEADER)?.trim() || randomUUID();
  const env = options.env ?? (process.env as ProxyEnvironment);

  let upstream: URL;
  try {
    upstream = resolveApiUpstream(requestUrl.pathname, env);
  } catch (error) {
    console.error('[web:api-proxy]', {
      requestId,
      method: request.method,
      pathname: requestUrl.pathname,
      message: error instanceof Error ? error.message : String(error),
    });
    return serviceUnavailable(requestId);
  }

  upstream.pathname = requestUrl.pathname;
  upstream.search = requestUrl.search;
  upstream.hash = '';

  const init: NodeRequestInit = {
    method: request.method,
    headers: requestHeaders(request, requestId, env),
    redirect: 'manual',
    signal: request.signal,
  };
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
    init.body = request.body;
    init.duplex = 'half';
  }

  try {
    const upstreamResponse = await (options.fetch ?? fetch)(upstream, init);
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders(upstreamResponse, requestId),
    });
  } catch (error) {
    console.error('[web:api-proxy]', {
      requestId,
      upstream: upstream.origin,
      method: request.method,
      pathname: requestUrl.pathname,
      message: error instanceof Error ? error.message : String(error),
    });
    return serviceUnavailable(requestId);
  }
}
