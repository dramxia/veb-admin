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
  author: { id: string; username: string; nickname: string | null } | null;
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
const blogPublicApiUrl =
  process.env.E2E_BLOG_PUBLIC_URL || 'http://127.0.0.1:1068';
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

test('blog management BFF publishes content for the public API', async ({
  page,
}) => {
  await login(page);

  const keepArticle = process.env.E2E_KEEP_ARTICLE === '1';
  const suffix = keepArticle ? 'service-isolation' : randomUUID().slice(0, 8);
  const slug = `ci-cross-service-${suffix}`;
  const title = keepArticle
    ? 'VEB 服务故障隔离文章'
    : `跨服务集成测试 ${suffix}`;
  const requestId = randomUUID();
  let articleId: string | undefined;
  let completed = false;

  try {
    if (keepArticle) {
      const existingResponse = await page.request.get(
        `/api/v1/blog/articles?page=1&pageSize=100&keyword=${encodeURIComponent(title)}`,
      );
      expect(existingResponse.status()).toBe(200);
      const existing = (await existingResponse.json()) as ApiEnvelope<
        PageResult<{ id: string; slug: string }>
      >;
      for (const item of existing.data?.items ?? []) {
        if (item.slug !== slug) continue;
        const deletion = await page.request.delete(
          `/api/v1/blog/articles/${item.id}`,
        );
        expect(deletion.status()).toBe(200);
      }
    }

    const createResponse = await page.request.post('/api/v1/blog/articles', {
      headers: { 'x-request-id': requestId },
      data: {
        title,
        slug,
        summary: '验证 VEB BFF、服务 JWT 与博客公开接口。',
        contentMarkdown:
          '# Integration\n\nPublished through the management BFF.',
        status: 'PUBLISHED',
        tagIds: [],
      },
    });
    const created =
      (await createResponse.json()) as ApiEnvelope<CreatedArticle>;
    articleId = created.data?.id;

    expect(createResponse.status()).toBe(200);
    expect(createResponse.headers()['x-request-id']).toBe(requestId);
    expect(created.code).toBe(0);
    expect(created.data).not.toBeNull();
    expect(created.data).toMatchObject({ title, slug, status: 'PUBLISHED' });
    expect(created.data?.author?.username).toBe('admin');

    const publicUrl = `${blogPublicApiUrl}/api/v1/public/articles/${slug}`;
    const publicResponse = await page.request.get(publicUrl);
    expect(publicResponse.status()).toBe(200);
    const publicPayload =
      (await publicResponse.json()) as ApiEnvelope<PublicArticle>;
    expect(publicPayload.code).toBe(0);
    expect(publicPayload.data).not.toBeNull();
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

    const firstLike = await page.request.put(`${publicUrl}/like`);
    expect(firstLike.status()).toBe(200);
    expect((await firstLike.json()) as ApiEnvelope<LikeState>).toMatchObject({
      code: 0,
      data: { liked: true, likeCount: 1 },
    });

    const repeatedLike = await page.request.put(`${publicUrl}/like`);
    expect(repeatedLike.status()).toBe(200);
    expect((await repeatedLike.json()) as ApiEnvelope<LikeState>).toMatchObject(
      {
        code: 0,
        data: { liked: true, likeCount: 1 },
      },
    );

    const articlePage = await page.goto(`/articles/${slug}`);
    expect(articlePage?.ok()).toBe(true);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    completed = true;
  } finally {
    if (articleId && (!keepArticle || !completed)) {
      const cleanup = await page.request.delete(
        `/api/v1/blog/articles/${articleId}`,
      );
      if (!cleanup.ok()) {
        console.warn(
          `Failed to clean up E2E article ${articleId}: ${cleanup.status()}`,
        );
      }
    }
  }
});
