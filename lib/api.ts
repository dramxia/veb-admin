import { LogStatus, type Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from './auth';
import { AppError, ERROR_CODES, ParamError } from './errors';
import { t } from './i18n';
import { logOperation } from './operation-log';

export type ApiResult<T> = {
  code: number;
  data: T | null;
  message: string;
};

export function ok<T>(data: T, message = 'ok') {
  return NextResponse.json<ApiResult<T>>({ code: ERROR_CODES.OK, data, message });
}

export function fail(code: number, message: string, status = 400) {
  return NextResponse.json<ApiResult<null>>({ code, data: null, message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return fail(ERROR_CODES.PARAM_ERROR, error.errors[0]?.message ?? t('error.param'), 400);
  }
  if (error instanceof AppError) {
    return fail(error.code, error.message, error.status);
  }
  console.error('[api:error]', error instanceof Error ? { message: error.message, stack: error.stack } : error);
  return fail(ERROR_CODES.SERVER_ERROR, t('error.server'), 500);
}

type WithApiOptions = {
  action?: string;
  target?: string | ((...args: unknown[]) => string | null | undefined);
  logSuccess?: boolean;
  logFailure?: boolean;
};

const sensitiveKeys = ['password', 'oldPassword', 'newPassword', 'passwordHash', 'token', 'secret'];

function redactPayload(value: unknown): Prisma.InputJsonValue | null {
  if (Array.isArray(value)) return value.map(redactPayload);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))
          ? '[REDACTED]'
          : redactPayload(item),
      ]),
    );
  }
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return String(value);
}

async function readLogPayload(req?: Request): Promise<Prisma.InputJsonValue | null | undefined> {
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
  const target = typeof options.target === 'function' ? options.target(...args) : options.target;

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
    const payloadPromise = options.action ? readLogPayload(req) : Promise.resolve(undefined);

    try {
      const response = await handler(...args);
      await writeActionLog(args, options, LogStatus.SUCCESS, undefined, await payloadPromise);
      return response;
    } catch (error) {
      await writeActionLog(
        args,
        options,
        LogStatus.FAILURE,
        error instanceof Error ? error.message : t('error.unknown'),
        await payloadPromise,
      );
      return handleApiError(error);
    }
  };
}

export async function readJson<T>(request: Request, schema: { parse: (data: unknown) => T }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ParamError(t('error.jsonRequired'));
  }
  return schema.parse(body);
}

export function parsePage(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
