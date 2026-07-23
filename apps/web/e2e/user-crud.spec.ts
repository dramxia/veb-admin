import { expect, test } from '@playwright/test';

test('user management requires authentication', async ({ page }) => {
  await page.goto('/admin/system/user');
  await expect(page).toHaveURL(/\/login/);
});
