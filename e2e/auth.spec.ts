import { expect, test } from '@playwright/test';

test('login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /登录|Sign in/i })).toBeVisible();
});

test('wrong password stays on login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/用户名|Username/i).fill('admin');
  await page.getByLabel(/密码|Password/i).fill('wrong-password');
  await page.getByRole('button', { name: /登录|Sign in/i }).click();
  await expect(page).toHaveURL(/\/login/);
});
