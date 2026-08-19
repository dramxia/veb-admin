import { ERROR_CODES } from '@veb/api-contracts';
import {
  AuthError,
  buildErrorResponse,
  fail,
  isDatabaseConnectionError,
  ok,
  pageOptions,
  readJson,
  readQuery,
  REQUEST_ID_HEADER,
  withApi as withApiKit,
  type ApiErrorMapper,
} from '@veb/api-kit';
import { ServiceAuthError, verifyServiceRequest } from '@veb/service-auth';

export { ok, pageOptions, readJson, readQuery };

export type RouteContext = { params: Record<string, string> };

export type ApiHandler<TContext = RouteContext> = (
  request: Request,
  context: TContext,
) => Promise<Response> | Response;

const serviceAuthErrorMapper: ApiErrorMapper = (error) => {
  if (!(error instanceof ServiceAuthError)) return undefined;
  if (error.status >= 500) {
    return fail(ERROR_CODES.SERVER_ERROR, '服务认证配置错误', 500);
  }
  if (error.status === 403) {
    return fail(ERROR_CODES.FORBIDDEN, '服务令牌权限不足', 403);
  }
  return fail(ERROR_CODES.UNAUTHORIZED, '服务身份验证失败', 401);
};

const databaseConnectionErrorMapper: ApiErrorMapper = (error) => {
  if (!isDatabaseConnectionError(error)) return undefined;
  console.error('[blog-api:database-unavailable]', {
    errorCode: error.errorCode ?? error.code ?? null,
    message: error.message ?? null,
  });
  return fail(
    ERROR_CODES.SERVICE_UNAVAILABLE,
    '博客数据库连接失败。请确认 blog-postgres 已启动；本地开发还需启动 Docker Desktop。',
    503,
  );
};

const errorMappers = [serviceAuthErrorMapper, databaseConnectionErrorMapper];

export function handleApiError(error: unknown, requestId?: string) {
  const response = buildErrorResponse(error, {
    mappers: errorMappers,
    logLabel: '[blog-api:error]',
    requestId,
  });
  if (requestId) response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export function withApi<TContext = RouteContext>(
  handler: ApiHandler<TContext>,
  options: { internal?: boolean; permission?: string | string[] } = {},
) {
  return withApiKit(handler, {
    scope: 'blog-api',
    errorMappers,
    beforeHandle: options.internal
      ? async ([request]) => {
          if (!request.headers.get(REQUEST_ID_HEADER)) {
            throw new AuthError('内部请求缺少 X-Request-Id');
          }
          await verifyServiceRequest(request, {
            audience: 'blog-api',
            permission: options.permission,
          });
        }
      : undefined,
  });
}
