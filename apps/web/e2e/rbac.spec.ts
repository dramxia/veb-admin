import { expect, test } from '@playwright/test';

test('anonymous user is redirected to login for protected page', async ({
  page,
}) => {
  await page.goto('/system/user');
  await expect(page).toHaveURL(/\/login/);
});
