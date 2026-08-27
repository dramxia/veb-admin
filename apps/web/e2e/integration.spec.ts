import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { login } from './helpers';

type ApiEnvelope<T> = {
  code: number;
  data: T | null;
  message: string;
};

type CreatedArticle = {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  author: { id: string; username: string; nickname: string | null };
};

type PublicArticle = {
  title: string;
  slug: string;
  summary: string | null;
  authorNickname: string | null;
  publishedAt: string;
  updatedAt: string;
  tags: Array<{ name: string; slug: string }>;
  likeCount: number;
  commentCount: number;
  contentMarkdown: string;
};

type LikeState = { liked: boolean; likeCount: number };
type LikeStats = {
  total: number;
  articles: Array<{ articleId: string; count: number }>;
};

test('blog management and public access share the Core API database', async ({
  browser,
  page,
  request,
}) => {
  await login(page);

  const suffix = randomUUID().slice(0, 8);
  const slug = `ci-core-api-${suffix}`;
  const title = `Core API 集成测试 ${suffix}`;
  const requestId = randomUUID();
  let articleId: string | undefined;

  try {
    const createResponse = await page.request.post(
      '/api/v1/blog/manage/articles',
      {
        headers: { 'x-request-id': requestId },
        data: {
          title,
          slug,
          summary: '验证统一 Core API 的管理、公开和点赞流程。',
          contentMarkdown: '# Integration\n\nPublished through Core API.',
          status: 'PUBLISHED',
          tagIds: [],
        },
      },
    );
    const created =
      (await createResponse.json()) as ApiEnvelope<CreatedArticle>;
    articleId = created.data?.id;

    expect(createResponse.status()).toBe(200);
    expect(createResponse.headers()['x-request-id']).toBe(requestId);
    expect(created.code).toBe(0);
    expect(created.data).toMatchObject({ title, slug, status: 'PUBLISHED' });
    expect(created.data?.author.username).toBe('admin');

    const publicUrl = `/api/v1/blog/articles/${slug}`;
    const publicResponse = await request.get(publicUrl);
    expect(publicResponse.status()).toBe(200);
    const publicPayload =
      (await publicResponse.json()) as ApiEnvelope<PublicArticle>;
    expect(publicPayload.code).toBe(0);
    expect(publicPayload.data).toMatchObject({ title, slug, likeCount: 0 });
    expect(Object.keys(publicPayload.data ?? {}).sort()).toEqual(
      [
        'authorNickname',
        'commentCount',
        'contentMarkdown',
        'likeCount',
        'publishedAt',
        'slug',
        'summary',
        'tags',
        'title',
        'updatedAt',
      ].sort(),
    );

    const firstLike = await request.put(`${publicUrl}/like`);
    expect(firstLike.status()).toBe(200);
    expect((await firstLike.json()) as ApiEnvelope<LikeState>).toMatchObject({
      code: 0,
      data: { liked: true, likeCount: 1 },
    });

    const repeatedLike = await request.put(`${publicUrl}/like`);
    expect(repeatedLike.status()).toBe(200);
    expect((await repeatedLike.json()) as ApiEnvelope<LikeState>).toMatchObject(
      {
        code: 0,
        data: { liked: true, likeCount: 1 },
      },
    );

    const from = new Date(Date.now() - 60_000).toISOString();
    const to = new Date(Date.now() + 60_000).toISOString();
    const statsResponse = await page.request.get(
      `/api/v1/blog/manage/likes/stats?articleId=${articleId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    expect(statsResponse.status()).toBe(200);
    const stats = (await statsResponse.json()) as ApiEnvelope<LikeStats>;
    expect(stats.data?.total).toBe(1);
    expect(stats.data?.articles).toContainEqual({
      articleId,
      count: 1,
      title,
      slug,
    });

    const anonymousContext = await browser.newContext({
      baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:1066',
    });
    try {
      const anonymousPage = await anonymousContext.newPage();
      const articlePage = await anonymousPage.goto(`/articles/${slug}`);
      expect(articlePage?.ok()).toBe(true);
      await expect(
        anonymousPage.getByRole('heading', { name: title }),
      ).toBeVisible();
    } finally {
      await anonymousContext.close();
    }

    const deletion = await page.request.delete(
      `/api/v1/blog/manage/articles/${articleId}`,
    );
    expect(deletion.status()).toBe(200);
    articleId = undefined;

    const deletedPublicArticle = await request.get(publicUrl);
    expect(deletedPublicArticle.status()).toBe(404);
  } finally {
    if (articleId) {
      const cleanup = await page.request.delete(
        `/api/v1/blog/manage/articles/${articleId}`,
      );
      if (!cleanup.ok()) {
        console.warn(
          `Failed to clean up E2E article ${articleId}: ${cleanup.status()}`,
        );
      }
    }
  }
});
