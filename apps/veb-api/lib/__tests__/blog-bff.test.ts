import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchBlogApi,
  injectArticleAuthor,
  needsPublishPermission,
  resolveBlogAuthorization,
} from '../blog-bff';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('blog BFF authorization', () => {
  it('maps management operations to existing content permissions', () => {
    expect(resolveBlogAuthorization('POST', ['articles'])?.permission).toBe(
      'content:article:create',
    );
    expect(
      resolveBlogAuthorization('GET', ['articles', 'authors'])?.permission,
    ).toBe('content:article:view');
    expect(
      resolveBlogAuthorization('PUT', ['articles', 'a1', 'tags'])?.permission,
    ).toBe('content:tag:assign');
    expect(
      resolveBlogAuthorization('GET', ['likes', 'stats'])?.permission,
    ).toBe('content:like:stats');
    expect(
      resolveBlogAuthorization('POST', ['likes', 'batch-delete'])?.permission,
    ).toBe('content:like:delete');
  });

  it('rejects unsupported resource and method combinations', () => {
    expect(resolveBlogAuthorization('PUT', ['tags', 'tag-1'])).toBeNull();
    expect(resolveBlogAuthorization('GET', ['unknown'])).toBeNull();
    expect(
      resolveBlogAuthorization('GET', ['articles', 'a1', 'unknown']),
    ).toBeNull();
    expect(resolveBlogAuthorization('POST', ['likes'])).toBeNull();
  });

  it('overwrites client-supplied author with the authenticated snapshot', () => {
    const actor = { id: 'u1', username: 'admin', nickname: '管理员' };
    expect(
      JSON.parse(
        injectArticleAuthor('{"title":"A","author":{"id":"bad"}}', actor),
      ),
    ).toEqual({
      title: 'A',
      author: actor,
    });
  });

  it('requires publish permission when a write publishes an article', () => {
    expect(
      needsPublishPermission('POST', ['articles'], '{"status":"PUBLISHED"}'),
    ).toBe(true);
    expect(
      needsPublishPermission('PATCH', ['articles', 'a1'], '{"status":"DRAFT"}'),
    ).toBe(false);
  });

  it('preserves the final upstream 503 response after retrying a GET', async () => {
    const payload = {
      code: 50301,
      data: null,
      message: '博客数据库连接失败，请启动 blog-postgres',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(payload), { status: 503 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(payload), { status: 503 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchBlogApi(
      new URL('http://blog-api:1068/api/internal/v1/articles'),
      { method: 'GET' },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual(payload);
  });

  it('describes how to recover when Blog API cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );

    await expect(
      fetchBlogApi(new URL('http://blog-api:1068/api/internal/v1/articles'), {
        method: 'GET',
      }),
    ).rejects.toMatchObject({
      status: 503,
      message: '无法连接 Blog API。请确认 blog-api 服务已启动。',
    });
  });
});
