import { expect, type Page } from '@playwright/test';

export async function login(
  page: Page,
  username = 'admin',
  password = process.env.E2E_ADMIN_PASSWORD || '',
) {
  if (!password)
    throw new Error('E2E_ADMIN_PASSWORD is required for admin login');
  await page.goto('/login');
  await page.getByLabel(/用户名|Username/i).fill(username);
  await page.getByLabel(/密码|Password/i).fill(password);
  await page.getByRole('button', { name: /登录|Sign in/i }).click();
  await page.waitForURL((url) => url.pathname === '/admin');
  await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible();
}
