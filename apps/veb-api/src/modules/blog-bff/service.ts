import {
  createServiceAuthorization,
  signServiceRequest,
} from '@veb/service-auth';
import { LogStatus } from '@/generated/client';
import { fail, handleApiError } from '@/lib/api';
import {
  fetchBlogApi,
  injectArticleAuthor,
  needsPublishPermission,
  resolveBlogAuthorization,
} from '@/lib/blog-bff';
import { getBlogApiEnv } from '@/lib/env';
import { ERROR_CODES, ParamError, ServiceUnavailableError } from '@/lib/errors';
import { logOperation } from '@/lib/operation-log';
import { assertPermission } from '@/lib/permission';
import {
  attachRequestId,
  getRequestId,
  REQUEST_ID_HEADER,
} from '@/lib/request-id';
import { requireUser } from '@/lib/session';

const passthroughResponseHeaders = [
  'content-type',
  'content-disposition',
  'cache-control',
] as const;

function createUpstreamUrl(baseUrl: string, pathname: string, search: string) {
  return new URL(`${pathname}${search}`, `${baseUrl}/`);
}

export async function proxyBlogAdminRequest(request: Request, path: string[]) {
  const requestId = getRequestId(request);
  const authorization = resolveBlogAuthorization(request.method, path);
  if (!authorization) {
    return attachRequestId(
      fail(ERROR_CODES.NOT_FOUND, '博客管理接口不存在', 404),
      requestId,
    );
  }

  let actorId: string | null = null;
  try {
    const user = await requireUser();
    actorId = user.id;
    await assertPermission(user.id, authorization.permission);

    const incomingBody = ['GET', 'HEAD'].includes(request.method)
      ? undefined
      : await request.text();
    const actor = {
      id: user.id,
      username: user.username,
      nickname: user.nickname ?? null,
    };
    let body = incomingBody;
    if (
      request.method === 'POST' &&
      path.length === 1 &&
      path[0] === 'articles'
    ) {
      try {
        body = injectArticleAuthor(incomingBody ?? '', actor);
      } catch (error) {
        throw new ParamError('文章请求体必须是有效的 JSON 对象', error);
      }
    }
    if (needsPublishPermission(request.method, path, body)) {
      await assertPermission(user.id, 'content:article:publish');
    }

    const internalPath = `/api/internal/v1/${path.map(encodeURIComponent).join('/')}`;
    let env: ReturnType<typeof getBlogApiEnv>;
    let token: string;
    try {
      env = getBlogApiEnv();
      token = await signServiceRequest(
        {
          audience: 'blog-api',
          permission: authorization.permission,
          method: request.method,
          path: internalPath,
          body,
          requestId,
          subject: user.id,
          actor,
        },
        {
          privateKeyPem: env.SERVICE_AUTH_PRIVATE_KEY.replace(/\\n/g, '\n'),
          keyId: env.SERVICE_AUTH_KEY_ID,
          issuer: env.SERVICE_AUTH_ISSUER,
        },
      );
    } catch (error) {
      throw new ServiceUnavailableError('博客服务认证配置不可用', error);
    }

    const sourceUrl = new URL(request.url);
    const upstream = await fetchBlogApi(
      createUpstreamUrl(
        env.BLOG_API_INTERNAL_URL,
        internalPath,
        sourceUrl.search,
      ),
      {
        method: request.method,
        headers: {
          accept: request.headers.get('accept') ?? 'application/json',
          authorization: createServiceAuthorization(token),
          'content-type':
            request.headers.get('content-type') ?? 'application/json',
          [REQUEST_ID_HEADER]: requestId,
        },
        body,
      },
    );

    const headers = new Headers({ [REQUEST_ID_HEADER]: requestId });
    for (const name of passthroughResponseHeaders) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers,
    });

    await logOperation({
      actorId: user.id,
      action: authorization.action,
      target: path.join('/'),
      payload: { requestId, permission: authorization.permission },
      status: upstream.ok ? LogStatus.SUCCESS : LogStatus.FAILURE,
      message: upstream.ok
        ? null
        : `blog-api responded with ${upstream.status}`,
      req: request,
    });
    return response;
  } catch (error) {
    await logOperation({
      actorId,
      action: authorization.action,
      target: path.join('/'),
      payload: { requestId, permission: authorization.permission },
      status: LogStatus.FAILURE,
      message: error instanceof Error ? error.message : '未知错误',
      req: request,
    });
    return handleApiError(error, requestId);
  }
}
