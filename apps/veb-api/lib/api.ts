import type { Prisma } from '@/generated/client';
import { LogStatus } from '@/generated/client';
import {
  buildErrorResponse,
  fail,
  ok,
  pageOptions,
  readJson,
  readQuery,
  withApi as withApiKit,
} from '@veb/api-kit';
import { auth } from './auth';
import { t } from './i18n';
import { logOperation } from './operation-log';

export { fail, ok, pageOptions, readJson, readQuery };

export function handleApiError(error: unknown, requestId?: string) {
  const response = buildErrorResponse(error, {
    serverErrorMessage: t('error.server'),
    logLabel: '[api:error]',
    requestId,
  });
  if (requestId) response.headers.set('x-request-id', requestId);
  return response;
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

const operationPayloads = new WeakMap<Response, Prisma.InputJsonValue | null>();

export function withOperationPayload<T extends Response>(
  response: T,
  payload: Prisma.InputJsonValue | null,
) {
  operationPayloads.set(response, payload);
  return response;
}

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

type WithApiState = {
  payloadPromise?: Promise<Prisma.InputJsonValue | null | undefined>;
};

export function withApi<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response> | Response,
  options: WithApiOptions = {},
) {
  return withApiKit<TArgs, WithApiState>(handler, {
    scope: 'veb-api',
    serverErrorMessage: t('error.server'),
    prepare: (args) => ({
      payloadPromise: options.action
        ? readLogPayload(args[0] instanceof Request ? args[0] : undefined)
        : Promise.resolve(undefined),
    }),
    onSuccess: async (args, response, state) => {
      await writeActionLog(
        args,
        options,
        LogStatus.SUCCESS,
        undefined,
        operationPayloads.get(response) ?? (await state.payloadPromise),
      );
    },
    onFailure: async (args, error, state) => {
      await writeActionLog(
        args,
        options,
        LogStatus.FAILURE,
        error instanceof Error ? error.message : t('error.unknown'),
        await state.payloadPromise,
      );
    },
  });
}
