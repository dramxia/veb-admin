import type { ApiErrorCode, ApiResult } from '@veb/api-contracts';
import { LogStatus, type Prisma } from '@/generated/client';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logApiAccess } from './access-log';
import { auth } from './auth';
import { AppError, ERROR_CODES, ParamError } from './errors';
import { t } from './i18n';
import { logOperation } from './operation-log';
import { attachRequestId, getRequestId } from './request-id';

export function ok<T>(data: T, message = 'ok') {
  return NextResponse.json<ApiResult<T>>({
    code: ERROR_CODES.OK,
    data,
    message,
  });
}

export function fail(code: ApiErrorCode, message: string, status = 400) {
  return NextResponse.json<ApiResult<null>>(
    { code, data: null, message },
    { status },
  );
}

export function handleApiError(error: unknown, requestId?: string) {
  let response: Response;
  if (error instanceof ZodError) {
    response = fail(
      ERROR_CODES.PARAM_ERROR,
      error.errors[0]?.message ?? t('error.param'),
      400,
    );
  } else if (error instanceof AppError) {
    response = fail(error.code, error.message, error.status);
  } else {
    console.error('[api:error]', {
      requestId: requestId ?? null,
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
    response = fail(ERROR_CODES.SERVER_ERROR, t('error.server'), 500);
  }
  return requestId ? attachRequestId(response, requestId) : response;
}

type WithApiOptions = {
  action?: string;
  target?: string | ((...args: unknown[]) => string | null | undefined);
  logSuccess?: boolean;
  logFailure?: boolean;
};

const sensitiveKeys = [
  'password',
  'oldPassword',
  'newPassword',
  'passwordHash',
  'token',
  'secret',
];

function redactPayload(value: unknown): Prisma.InputJsonValue | null {
  if (Array.isArray(value)) return value.map(redactPayload);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sensitiveKeys.some((sensitive) =>
          key.toLowerCase().includes(sensitive.toLowerCase()),
        )
          ? '[REDACTED]'
          : redactPayload(item),
      ]),
    );
  }
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  return String(value);
}

async function readLogPayload(
  req?: Request,
): Promise<Prisma.InputJsonValue | null | undefined> {
  if (!req) return undefined;
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return undefined;
  try {
    return redactPayload(await req.clone().json());
  } catch {
    return undefined;
  }
}

async function writeActionLog(
  args: unknown[],
  options: WithApiOptions,
  status: LogStatus,
  message?: string,
  payload?: Prisma.InputJsonValue | null,
) {
  if (!options.action) return;
  if (status === LogStatus.SUCCESS && options.logSuccess === false) return;
  if (status === LogStatus.FAILURE && options.logFailure === false) return;

  const req = args[0] instanceof Request ? args[0] : undefined;
  const session = await auth().catch(() => null);
  const target =
    typeof options.target === 'function'
      ? options.target(...args)
      : options.target;

  await logOperation({
    actorId: session?.user?.id || null,
    action: options.action,
    target: target || null,
    payload,
    status,
    message,
    req,
  });
}

export function withApi<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response> | Response,
  options: WithApiOptions = {},
) {
  return async (...args: TArgs) => {
    const req = args[0] instanceof Request ? args[0] : undefined;
    const requestId = req ? getRequestId(req) : undefined;
    const startedAt = Date.now();
    const payloadPromise = options.action
      ? readLogPayload(req)
      : Promise.resolve(undefined);

    try {
      const response = await handler(...args);
      await writeActionLog(
        args,
        options,
        LogStatus.SUCCESS,
        undefined,
        await payloadPromise,
      );
      const result = requestId
        ? attachRequestId(response, requestId)
        : response;
      if (req && requestId) logApiAccess(req, result, requestId, startedAt);
      return result;
    } catch (error) {
      await writeActionLog(
        args,
        options,
        LogStatus.FAILURE,
        error instanceof Error ? error.message : t('error.unknown'),
        await payloadPromise,
      );
      const response = handleApiError(error, requestId);
      if (req && requestId) logApiAccess(req, response, requestId, startedAt);
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
  } catch {
    throw new ParamError(t('error.jsonRequired'));
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
