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
  const title = `Core API 集成测试 ${suffix}`;
  const previewEndMarker = `预览正文结束 ${suffix}`;
  const contentMarkdown = [
    '# Integration',
    ...Array.from(
      { length: 80 },
      (_, index) =>
        `## Section ${index + 1}\n\nLong preview content ${index + 1}.`,
    ),
    `## ${previewEndMarker}`,
  ].join('\n\n');
  const requestId = randomUUID();
  let articleId: string | undefined;

  try {
    const createResponse = await page.request.post(
      '/api/v1/blog/manage/articles',
      {
        headers: { 'x-request-id': requestId },
        data: {
          title,
          summary: null,
          contentMarkdown,
          status: 'DRAFT',
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
    expect(created.data).toMatchObject({ title, status: 'DRAFT' });
    expect(created.data?.author.username).toBe('admin');

    const articleIdentifier = created.data?.slug;
    expect(articleIdentifier).toMatch(/^\d+$/);
    expect(Number(articleIdentifier)).toBeGreaterThanOrEqual(20_000);
    if (!articleIdentifier)
      throw new Error('Article identifier was not returned');

    const publicUrl = `/api/v1/blog/articles/${articleIdentifier}`;
    const draftPublicResponse = await request.get(publicUrl);
    expect(draftPublicResponse.status()).toBe(404);

    await page.goto('/admin/blog/article');
    const articleRow = page.getByRole('row').filter({ hasText: title });
    await expect(articleRow).toBeVisible();

    await articleRow.getByRole('button', { name: '预览文章' }).click();
    const previewDialog = page.getByRole('dialog', { name: '文章预览' });
    await expect(previewDialog).toBeVisible();
    await expect(
      previewDialog.getByRole('heading', { name: title }),
    ).toBeVisible();
    await expect(
      previewDialog.getByText('草稿', { exact: true }),
    ).toBeVisible();
    const previewEnd = previewDialog.getByRole('heading', {
      name: previewEndMarker,
    });
    await previewEnd.scrollIntoViewIfNeeded();
    await expect(previewEnd).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(previewDialog).toBeHidden();

    const [publishResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === 'PATCH' &&
          response.url().includes(`/api/v1/blog/manage/articles/${articleId}`),
        { timeout: 15_000 },
      ),
      articleRow
        .getByRole('checkbox', { name: `将《${title}》正式发布` })
        .locator('..')
        .click(),
    ]);
    expect(publishResponse.status()).toBe(200);
    await expect(articleRow.getByText('已发布', { exact: true })).toBeVisible();

    const publicResponse = await request.get(publicUrl);
    expect(publicResponse.status()).toBe(200);
    const publicPayload =
      (await publicResponse.json()) as ApiEnvelope<PublicArticle>;
    expect(publicPayload.code).toBe(0);
    expect(publicPayload.data).toMatchObject({
      title,
      slug: articleIdentifier,
      likeCount: 0,
    });
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
      slug: articleIdentifier,
    });

    const anonymousContext = await browser.newContext({
      baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:1066',
    });
    try {
      const anonymousPage = await anonymousContext.newPage();
      const articlePage = await anonymousPage.goto(
        `/articles/${articleIdentifier}`,
      );
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
