import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { login } from './helpers';

type ApiEnvelope<T> = {
  code: number;
  data: T | null;
  message: string;
};

type CreatedTag = {
  id: string;
  name: string;
  slug: string;
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
  const tagName = `预览标签 ${suffix}`;
  const tagSlug = `preview-${suffix}`;
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
  let tagId: string | undefined;

  try {
    const createTagResponse = await page.request.post(
      '/api/v1/blog/manage/tags',
      {
        data: { name: tagName, slug: tagSlug },
      },
    );
    const createdTag =
      (await createTagResponse.json()) as ApiEnvelope<CreatedTag>;
    tagId = createdTag.data?.id;

    expect(createTagResponse.status()).toBe(200);
    expect(createdTag).toMatchObject({
      code: 0,
      data: { name: tagName, slug: tagSlug },
    });
    if (!tagId) throw new Error('Tag id was not returned');

    const createResponse = await page.request.post(
      '/api/v1/blog/manage/articles',
      {
        headers: { 'x-request-id': requestId },
        data: {
          title,
          summary: null,
          contentMarkdown,
          status: 'DRAFT',
          tagIds: [tagId],
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
    const directOverlayRoot = page.getByTestId('managed-overlay-root');
    await expect(previewDialog).toBeVisible();
    await expect(directOverlayRoot).toHaveAttribute('data-overlay-count', '1');
    expect(
      await previewDialog.evaluate((dialog) =>
        dialog.contains(document.activeElement),
      ),
    ).toBe(true);
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

    await page.goto('/admin/blog/tag');
    const tagRow = page.getByRole('row').filter({ hasText: tagName });
    await expect(tagRow).toBeVisible();
    await tagRow.getByRole('button', { name: '查看关联文章' }).click();

    const relatedDrawer = page
      .getByRole('dialog')
      .filter({ hasText: `${tagName} · 关联文章` });
    const relatedDrawerSurface = page.getByTestId('related-articles-drawer');
    await expect(relatedDrawer.getByText(title, { exact: true })).toBeVisible();
    await relatedDrawer
      .getByRole('button', { name: `预览文章《${title}》` })
      .click();

    const tagPreviewDialog = page.getByRole('dialog', { name: '文章预览' });
    const overlayRoot = page.getByTestId('managed-overlay-root');
    await expect(tagPreviewDialog).toBeVisible();
    await expect(relatedDrawerSurface).toBeVisible();
    await expect(
      relatedDrawerSurface.getByText(title, { exact: true }),
    ).toBeVisible();
    await expect(
      overlayRoot.getByRole('dialog', { includeHidden: true }),
    ).toHaveCount(2);
    await expect(overlayRoot).toHaveAttribute('data-overlay-count', '2');
    await expect(
      tagPreviewDialog.getByRole('heading', { name: title }),
    ).toBeVisible();
    await expect(
      tagPreviewDialog.getByText('草稿', { exact: true }),
    ).toBeVisible();
    const tagPreviewEnd = tagPreviewDialog.getByRole('heading', {
      name: previewEndMarker,
    });
    const tagPreviewBody = tagPreviewDialog.getByTestId(
      'article-preview-scroll',
    );
    await tagPreviewBody.hover();
    await page.mouse.wheel(0, 1_000);
    await expect
      .poll(() => tagPreviewBody.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await tagPreviewEnd.scrollIntoViewIfNeeded();
    await expect(tagPreviewEnd).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tagPreviewDialog).toBeHidden();
    await expect(overlayRoot).toHaveAttribute('data-overlay-count', '1');
    await expect(relatedDrawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(relatedDrawer).toBeHidden();

    await page.goto('/admin/blog/article');
    await expect(articleRow).toBeVisible();

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

    const tagDeletion = await page.request.delete(
      `/api/v1/blog/manage/tags/${tagId}`,
    );
    expect(tagDeletion.status()).toBe(200);
    tagId = undefined;

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
    if (tagId) {
      const cleanup = await page.request.delete(
        `/api/v1/blog/manage/tags/${tagId}`,
      );
      if (!cleanup.ok()) {
        console.warn(
          `Failed to clean up E2E tag ${tagId}: ${cleanup.status()}`,
        );
      }
    }
  }
});
