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

  const redirectedUrl = new URL(location!, response.url());
  expect(`${redirectedUrl.pathname}${redirectedUrl.search}`).toBe(to);
}

test('PAGE namespaces are not rewritten by broad redirects', async ({
  page,
}) => {
  await login(page);

  const systemResponse = await page.request.get('/system/user?status=enabled', {
    maxRedirects: 0,
  });
  const contentResponse = await page.request.get('/content/article/new', {
    maxRedirects: 0,
  });

  expect(systemResponse.status()).toBe(404);
  expect(systemResponse.headers()['location']).toBeUndefined();
  expect(contentResponse.status()).toBe(404);
  expect(contentResponse.headers()['location']).toBeUndefined();
});

test('the root redirects to the first authorized module home', async ({
  page,
}) => {
  await login(page);
  await expectRedirect(page, '/', '/dashboard', 307);
  await expectRedirect(page, '/admin', '/admin/content/article', 307);
});

test('the forbidden page preserves an HTTP 403 status', async ({ page }) => {
  const response = await page.request.get('/403');
  expect(response.status()).toBe(403);
});
