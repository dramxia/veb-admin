import { randomUUID } from 'node:crypto';
import {
  ERROR_CODES,
  createApiError,
  createApiSuccess,
  type ApiErrorCode,
} from '@veb/api-contracts';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ServiceAuthError, verifyServiceRequest } from '@veb/service-auth';
import { logApiAccess } from './access-log';
import { AppError, AuthError, ParamError } from './errors';

export type RouteContext = { params: Record<string, string> };

export type ApiHandler<TContext = RouteContext> = (
  request: Request,
  context: TContext,
) => Promise<Response> | Response;

export function ok<T>(data: T, message = 'ok') {
  return NextResponse.json(createApiSuccess(data, message));
}

function fail(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json(createApiError(code, message), { status });
}

function requestIdFor(request: Request) {
  return request.headers.get('x-request-id')?.trim() || randomUUID();
}

function errorResponse(error: unknown, requestId: string) {
  if (error instanceof ZodError) {
    return fail(
      ERROR_CODES.PARAM_ERROR,
      error.errors[0]?.message ?? '请求参数错误',
      400,
    );
  }
  if (error instanceof AppError) {
    return fail(error.code, error.message, error.status);
  }
  if (error instanceof ServiceAuthError) {
    if (error.status >= 500) {
      return fail(ERROR_CODES.SERVER_ERROR, '服务认证配置错误', 500);
    }
    if (error.status === 403) {
      return fail(ERROR_CODES.FORBIDDEN, '服务令牌权限不足', 403);
    }
    return fail(ERROR_CODES.UNAUTHORIZED, '服务身份验证失败', 401);
  }
  console.error('[blog-api:error]', {
    requestId,
    error:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error,
  });
  return fail(ERROR_CODES.SERVER_ERROR, '服务器内部错误', 500);
}

export function withApi<TContext = RouteContext>(
  handler: ApiHandler<TContext>,
  options: { internal?: boolean; permission?: string | string[] } = {},
) {
  return async (request: Request, context: TContext) => {
    const requestId = requestIdFor(request);
    const startedAt = Date.now();
    try {
      if (options.internal) {
        if (!request.headers.get('x-request-id')) {
          throw new AuthError('内部请求缺少 X-Request-Id');
        }
        await verifyServiceRequest(request, {
          audience: 'blog-api',
          permission: options.permission,
        });
      }
      const response = await handler(request, context);
      response.headers.set('x-request-id', requestId);
      logApiAccess(request, response, requestId, startedAt);
      return response;
    } catch (error) {
      const response = errorResponse(error, requestId);
      response.headers.set('x-request-id', requestId);
      logApiAccess(request, response, requestId, startedAt);
      return response;
    }
  };
}

export async function readJson<T>(
  request: Request,
  schema: { parse(data: unknown): T },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    throw new ParamError('请求体必须是 JSON', { cause: error });
  }
  return schema.parse(body);
}

export function readQuery<T>(
  request: Request,
  schema: { parse(data: unknown): T },
) {
  return schema.parse(Object.fromEntries(new URL(request.url).searchParams));
}
