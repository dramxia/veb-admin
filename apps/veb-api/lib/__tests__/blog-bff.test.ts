import { describe, expect, it } from 'vitest';
import {
  injectArticleAuthor,
  needsPublishPermission,
  resolveBlogAuthorization,
} from '../blog-bff';

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
});
