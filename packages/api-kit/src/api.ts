import { randomUUID } from 'node:crypto';
import {
  createApiError,
  createApiSuccess,
  ERROR_CODES,
  type ApiErrorCode,
  type ApiResult,
} from '@veb/api-contracts';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logApiAccess } from './access-log';
import { AppError, ParamError } from './errors';
import { getRequestId, REQUEST_ID_HEADER } from './request-id';

export function ok<T>(data: T, message = 'ok') {
  return NextResponse.json<ApiResult<T>>(createApiSuccess(data, message));
}

export function fail(code: ApiErrorCode, message: string, status = 400) {
  return NextResponse.json<ApiResult<null>>(createApiError(code, message), {
    status,
  });
}

/**
 * 在 ZodError / AppError 的内置映射之后、500 兜底之前依次尝试。
 * 返回 falsy 表示不匹配，交给下一个 mapper。
 */
export type ApiErrorMapper = (error: unknown) => Response | null | undefined;

export type ErrorResponseOptions = {
  mappers?: ApiErrorMapper[];
  /** 未匹配错误的 500 响应文案，默认「服务器内部错误」 */
  serverErrorMessage?: string;
  /** 500 兜底时 console.error 的日志标签，例如 [veb-api:error] */
  logLabel?: string;
  /** 透传到错误日志的链路 ID */
  requestId?: string;
};

export function buildErrorResponse(
  error: unknown,
  options: ErrorResponseOptions = {},
) {
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
  for (const mapper of options.mappers ?? []) {
    const response = mapper(error);
    if (response) return response;
  }
  console.error(options.logLabel ?? '[api:error]', {
    requestId: options.requestId ?? null,
    error:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error,
  });
  return fail(
    ERROR_CODES.SERVER_ERROR,
    options.serverErrorMessage ?? '服务器内部错误',
    500,
  );
}

export type WithApiHooks<TArgs extends unknown[], TState = void> = {
  /** 访问日志与错误日志的应用标识，例如 veb-api / blog-api */
  scope: string;
  serverErrorMessage?: string;
  errorMappers?: ApiErrorMapper[];
  /** 每次调用最先执行（同步），可在此启动请求体预读等异步工作 */
  prepare?: (args: TArgs) => TState;
  /** handler 之前执行，抛错（如内部服务验签失败）会进入统一错误响应 */
  beforeHandle?: (args: TArgs, state: TState) => void | Promise<void>;
  onSuccess?: (
    args: TArgs,
    response: Response,
    state: TState,
  ) => void | Promise<void>;
  onFailure?: (
    args: TArgs,
    error: unknown,
    state: TState,
  ) => void | Promise<void>;
};

export function withApi<TArgs extends unknown[], TState = void>(
  handler: (...args: TArgs) => Promise<Response> | Response,
  hooks: WithApiHooks<TArgs, TState>,
) {
  return async (...args: TArgs): Promise<Response> => {
    const req = args[0] instanceof Request ? args[0] : undefined;
    const requestId = req ? getRequestId(req) : randomUUID();
    const startedAt = Date.now();
    const state = hooks.prepare?.(args) as TState;

    try {
      if (hooks.beforeHandle) await hooks.beforeHandle(args, state);
      const response = await handler(...args);
      if (hooks.onSuccess) await hooks.onSuccess(args, response, state);
      response.headers.set(REQUEST_ID_HEADER, requestId);
      if (req) logApiAccess(hooks.scope, req, response, requestId, startedAt);
      return response;
    } catch (error) {
      if (hooks.onFailure) await hooks.onFailure(args, error, state);
      const response = buildErrorResponse(error, {
        mappers: hooks.errorMappers,
        serverErrorMessage: hooks.serverErrorMessage,
        logLabel: `[${hooks.scope}:error]`,
        requestId,
      });
      response.headers.set(REQUEST_ID_HEADER, requestId);
      if (req) logApiAccess(hooks.scope, req, response, requestId, startedAt);
      return response;
    }
  };
}

export async function readJson<T>(
  request: Request,
  schema: { parse: (data: unknown) => T },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    throw new ParamError('请求体必须是有效的 JSON', error);
  }
  return schema.parse(body);
}

export function readQuery<T>(
  request: Request,
  schema: { parse(data: unknown): T },
) {
  return schema.parse(Object.fromEntries(new URL(request.url).searchParams));
}

export function pageOptions(query: { page: number; pageSize: number }) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    skip: (query.page - 1) * query.pageSize,
  };
}
