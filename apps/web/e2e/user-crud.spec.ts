import { expect, test } from '@playwright/test';

test('user management requires authentication', async ({ page }) => {
  await page.goto('/system/user');
  await expect(page).toHaveURL(/\/login/);
});
