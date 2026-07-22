import 'server-only';

import type { ApiResult } from '@veb/api-contracts';
import { randomUUID } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

type ServerRequestInit = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null;
};

export class ServerApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: number,
  ) {
    super(message);
    this.name = 'ServerApiError';
  }
}

function cookieHeader() {
  return cookies()
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
}

function requestBody(body: ServerRequestInit['body']) {
  if (
    body === undefined ||
    body === null ||
    typeof body === 'string' ||
    body instanceof URLSearchParams ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
  ) {
    return body as BodyInit | null | undefined;
  }
  return JSON.stringify(body);
}

async function requestService<T>(
  baseUrl: string,
  path: string,
  init: ServerRequestInit = {},
) {
  const requestId = headers().get('x-request-id') || randomUUID();
  const body = requestBody(init.body);
  const requestHeaders = new Headers(init.headers);
  const cookie = cookieHeader();

  requestHeaders.set('accept', 'application/json');
  requestHeaders.set('x-request-id', requestId);
  if (cookie) requestHeaders.set('cookie', cookie);
  if (body && typeof body === 'string' && !requestHeaders.has('content-type')) {
    requestHeaders.set('content-type', 'application/json');
  }

  const response = await fetch(new URL(path, baseUrl), {
    ...init,
    body,
    cache: init.cache ?? 'no-store',
    headers: requestHeaders,
  });
  const text = await response.text();
  let payload: ApiResult<T> | null = null;

  try {
    payload = text ? (JSON.parse(text) as ApiResult<T>) : null;
  } catch {
    throw new ServerApiError('接口返回格式异常', response.status);
  }

  if (!response.ok || !payload || payload.code !== 0 || payload.data === null) {
    throw new ServerApiError(
      payload?.message || '服务暂时不可用',
      response.status,
      payload?.code,
    );
  }
  return payload.data;
}

const vebApiUrl = process.env.VEB_API_INTERNAL_URL || 'http://127.0.0.1:1067';
const blogApiUrl = process.env.BLOG_API_INTERNAL_URL || 'http://127.0.0.1:1068';

export function requestVeb<T>(path: string, init?: ServerRequestInit) {
  return requestService<T>(vebApiUrl, path, init);
}

export function requestBlogPublic<T>(path: string, init?: ServerRequestInit) {
  return requestService<T>(blogApiUrl, path, init);
}

export async function requestVebPage<T>(
  path: string,
  init?: ServerRequestInit,
) {
  try {
    return await requestVeb<T>(path, init);
  } catch (error) {
    if (isServerApiError(error, 401)) redirect('/login');
    if (isServerApiError(error, 403)) redirect('/403');
    throw error;
  }
}

export function isServerApiError(
  error: unknown,
  status?: number,
): error is ServerApiError {
  return (
    error instanceof ServerApiError &&
    (status === undefined || error.status === status)
  );
}
