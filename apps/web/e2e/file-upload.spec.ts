import { expect, test } from '@playwright/test';

test('file management requires authentication', async ({ page }) => {
  await page.goto('/system/file');
  await expect(page).toHaveURL(/\/login/);
});
