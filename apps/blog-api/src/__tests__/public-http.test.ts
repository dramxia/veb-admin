import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODES } from '@veb/api-contracts';
import { resetRateLimit } from '@/lib/rate-limit';
import { putArticleLike } from '@/http/public';

const contentServiceMock = vi.hoisted(() => ({
  getLikeState: vi.fn(),
  getPublicArticle: vi.fn(),
  getPublicTag: vi.fn(),
  getPublishedArticleIdentity: vi.fn(),
  likeArticle: vi.fn(),
  listPublicArticles: vi.fn(),
  listPublicTags: vi.fn(),
  unlikeArticle: vi.fn(),
}));

vi.mock('@/modules/content/service', () => contentServiceMock);

function likeRequest() {
  const request = new Request(
    'http://blog-api:1068/api/v1/public/articles/rate-limited/like',
    {
      method: 'PUT',
      headers: { 'x-forwarded-for': '203.0.113.10' },
    },
  ) as NextRequest;
  Object.defineProperty(request, 'cookies', {
    value: {
      get: () => ({ value: 'existing-visitor' }),
    },
  });
  return request;
}

describe('public like HTTP endpoint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-22T08:00:00.000Z'));
    vi.clearAllMocks();
    resetRateLimit();
    process.env.BLOG_VISITOR_HASH_SECRET = 'test-visitor-secret';
    contentServiceMock.getPublishedArticleIdentity.mockResolvedValue({
      id: 'article-1',
    });
    contentServiceMock.likeArticle.mockResolvedValue({
      liked: true,
      likeCount: 1,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimit();
  });

  it('returns the contract rate-limit error after 30 requests from one IP', async () => {
    for (let count = 0; count < 30; count += 1) {
      const response = await putArticleLike(likeRequest(), {
        params: { slug: 'rate-limited' },
      });
      expect(response.status).toBe(200);
    }

    const blocked = await putArticleLike(likeRequest(), {
      params: { slug: 'rate-limited' },
    });

    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toEqual({
      code: ERROR_CODES.RATE_LIMITED,
      data: null,
      message: '请求过于频繁',
    });
    expect(contentServiceMock.likeArticle).toHaveBeenCalledTimes(30);
  });
});
