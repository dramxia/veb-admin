import { expect, test } from '@playwright/test';

const slug = 'ci-cross-service-service-isolation';
const title = 'VEB 服务故障隔离文章';
const blogPublicApiUrl =
  process.env.E2E_BLOG_PUBLIC_URL || 'http://127.0.0.1:1068';

test.skip(
  process.env.E2E_SERVICE_ISOLATION !== '1',
  'Only runs after CI has stopped veb-api',
);

test('public article remains readable while VEB API is unavailable', async ({
  page,
}) => {
  const publicResponse = await page.request.get(
    `${blogPublicApiUrl}/api/v1/public/articles/${slug}`,
  );
  expect(publicResponse.status()).toBe(200);
  await expect(publicResponse.json()).resolves.toMatchObject({
    code: 0,
    data: { slug, title },
  });

  const articlePage = await page.goto(`/articles/${slug}`);
  expect(articlePage?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});
