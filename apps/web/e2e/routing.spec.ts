import { expect, test, type Page } from '@playwright/test';
import { login } from './helpers';

async function expectRedirect(
  page: Page,
  from: string,
  to: string,
  status: 307 | 308,
) {
  const response = await page.request.get(from, { maxRedirects: 0 });
  const location = response.headers()['location'];

  expect(response.status()).toBe(status);
  expect(location).toBeTruthy();

  const redirectedUrl = new URL(location!, page.url());
  expect(`${redirectedUrl.pathname}${redirectedUrl.search}`).toBe(to);
}

test('legacy admin URLs use permanent redirects into /admin', async ({
  page,
}) => {
  await login(page);

  await expectRedirect(
    page,
    '/system/user?status=enabled',
    '/admin/system/user?status=enabled',
    308,
  );
  await expectRedirect(
    page,
    '/content/article/new',
    '/admin/content/article/new',
    308,
  );
  await expectRedirect(page, '/profile', '/admin/profile', 308);
});

test('the root temporarily redirects to the admin module home', async ({
  page,
}) => {
  await login(page);
  await expectRedirect(page, '/', '/admin', 307);
});
