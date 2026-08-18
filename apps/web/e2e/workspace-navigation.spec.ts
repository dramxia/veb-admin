import { expect, test, type Locator, type Page } from '@playwright/test';
import { login } from './helpers';

async function getAdminModuleLink(page: Page): Promise<Locator> {
  const desktopNavigation = page.getByRole('navigation', { name: '应用模块' });
  if (await desktopNavigation.isVisible()) {
    return desktopNavigation.getByRole('link', {
      name: '后台管理',
      exact: true,
    });
  }

  await page.getByRole('button', { name: '切换应用模块' }).click();
  return page.getByRole('menuitem', { name: '后台管理', exact: true });
}

async function expectHeaderControlsInsideViewport(page: Page) {
  const layoutIssues = await page.getByRole('banner').evaluate((header) => {
    const controls = [...header.querySelectorAll<HTMLElement>('a, button')]
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((element) => ({
        label:
          element.getAttribute('aria-label') ||
          element.textContent?.trim() ||
          '',
        rect: element.getBoundingClientRect().toJSON(),
      }));
    const issues = controls
      .filter(
        ({ rect }) => rect.left < -0.5 || rect.right > window.innerWidth + 0.5,
      )
      .map(({ label }) => `${label} exceeds the viewport`);

    for (let left = 0; left < controls.length; left += 1) {
      for (let right = left + 1; right < controls.length; right += 1) {
        const first = controls[left]!;
        const second = controls[right]!;
        const horizontallyOverlapping =
          first.rect.left < second.rect.right - 0.5 &&
          first.rect.right > second.rect.left + 0.5;
        const verticallyOverlapping =
          first.rect.top < second.rect.bottom - 0.5 &&
          first.rect.bottom > second.rect.top + 0.5;

        if (horizontallyOverlapping && verticallyOverlapping) {
          issues.push(`${first.label} overlaps ${second.label}`);
        }
      }
    }

    return issues;
  });

  expect(layoutIssues).toEqual([]);
}

test('workspace navigation keeps the admin module active and restores its home', async ({
  page,
}) => {
  await login(page);
  await page.goto('/admin/system/user');
  await expect(page).toHaveURL(/\/admin\/system\/user$/);

  const moduleLink = await getAdminModuleLink(page);
  await expect(moduleLink).toHaveAttribute('aria-current', 'page');
  await expect(moduleLink).toHaveAttribute('href', '/admin/content/article');
  await moduleLink.click();
  await expect(page).toHaveURL(/\/admin\/content\/article$/);

  await page.goto('/admin/system/user');
  await page
    .getByRole('link', { name: '返回后台管理首个菜单', exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/content\/article$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/admin\/system\/user$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/admin\/content\/article$/);
  await page.reload();
  await expect(page).toHaveURL(/\/admin\/content\/article$/);

  await expect(
    page.getByRole('button', { name: '搜索应用菜单' }),
  ).toBeVisible();
  await expectHeaderControlsInsideViewport(page);
});

test('the dashboard module keeps header actions without sidebar infrastructure', async ({
  page,
}) => {
  await login(page);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('aside')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /侧边栏/ })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: '搜索应用菜单' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: '返回仪表盘首个菜单', exact: true }),
  ).toHaveAttribute('href', '/dashboard');
  await expectHeaderControlsInsideViewport(page);
});

test('header controls fit the supported responsive widths', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');

  await login(page);
  await page.goto('/admin/system/user');

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });

    if (width >= 1280) {
      await expect(
        page.getByRole('navigation', { name: '应用模块' }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole('button', { name: '切换应用模块' }),
      ).toBeVisible();
    }

    if (width >= 992) {
      await expect(page.locator('aside')).not.toHaveAttribute('inert', '');
      await expect(page.locator('aside')).not.toHaveAttribute(
        'aria-hidden',
        'true',
      );
    } else {
      await expect(page.locator('aside')).toHaveAttribute('inert', '');
      await expect(page.locator('aside')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    }

    await expectHeaderControlsInsideViewport(page);
  }
});

test('desktop sidebar preference is restored on refresh', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');

  await login(page);
  await page.goto('/admin/system/user');
  const sidebar = page.locator('aside');
  await page.getByRole('button', { name: '收起侧边栏' }).click();
  await expect
    .poll(async () => (await sidebar.boundingBox())?.width ?? 0)
    .toBeLessThanOrEqual(76);

  await page.reload();
  await expect(page.getByRole('button', { name: '展开侧边栏' })).toBeVisible();
  await expect
    .poll(async () => (await sidebar.boundingBox())?.width ?? 0)
    .toBeLessThanOrEqual(76);

  await page.getByRole('button', { name: '展开侧边栏' }).click();
});

test('desktop sidebar tooltip only opens from pointer hover', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');

  await login(page);
  await page.goto('/admin/system/user');

  const sidebarToggle = page.getByRole('button', { name: '收起侧边栏' });
  const sidebarTooltip = page
    .locator('[role="tooltip"]')
    .filter({ hasText: '收起侧边栏' });

  await sidebarToggle.focus();
  await expect(sidebarTooltip).toHaveCount(0);

  await page.getByRole('button', { name: '新增用户' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await sidebarToggle.evaluate((button) => {
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  });
  await expect(sidebarTooltip).toHaveCount(0);

  await page.getByRole('button', { name: '关闭用户表单' }).click();
  await sidebarToggle.hover();
  await expect(sidebarTooltip).toBeVisible();
});

test('the 375px module header and mobile sidebar stay within the viewport', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');

  await login(page);
  await page.goto('/admin/system/user');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: '收起侧边栏' }).click();
  await expect
    .poll(async () => (await page.locator('aside').boundingBox())?.width ?? 0)
    .toBeLessThanOrEqual(76);

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(
    page.getByRole('button', { name: '切换应用模块' }),
  ).toContainText('后台管理');
  await expectHeaderControlsInsideViewport(page);

  const sidebar = page.locator('aside');
  await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  await expect(sidebar).toHaveAttribute('inert', '');
  expect(
    await sidebar
      .locator('a')
      .evaluateAll((links) => links.every((link) => link.tabIndex === -1)),
  ).toBe(true);

  await page.getByRole('button', { name: '打开侧边栏' }).click();
  await expect(sidebar).not.toHaveAttribute('aria-hidden', 'true');
  await expect(sidebar).not.toHaveAttribute('inert', '');
  await expect
    .poll(
      async () => (await sidebar.boundingBox())?.x ?? Number.NEGATIVE_INFINITY,
    )
    .toBeGreaterThanOrEqual(0);
  await expect
    .poll(async () => (await sidebar.boundingBox())?.width ?? 0)
    .toBeGreaterThanOrEqual(180);
  await expect(sidebar.getByRole('link', { name: '用户管理' })).toContainText(
    '用户管理',
  );
  await expect(
    page.getByRole('button', { name: '关闭侧边栏' }),
  ).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Escape');
  await expect
    .poll(async () => {
      const box = await sidebar.boundingBox();
      return box ? box.x + box.width : 0;
    })
    .toBeLessThanOrEqual(1);
  await expect(
    page.getByRole('button', { name: '打开侧边栏' }),
  ).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: '打开侧边栏' })).toBeFocused();
  await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  await expect(sidebar).toHaveAttribute('inert', '');
  expect(
    await sidebar
      .locator('a')
      .first()
      .evaluate((link) => {
        link.focus();
        return document.activeElement === link;
      }),
  ).toBe(false);

  await page.getByRole('button', { name: '打开侧边栏' }).click();
  await page
    .getByTestId('admin-sidebar-overlay')
    .click({ position: { x: 8, y: 8 } });
  await expect(page.getByRole('button', { name: '打开侧边栏' })).toBeFocused();

  await page.getByRole('button', { name: '打开侧边栏' }).click();
  await page.getByRole('button', { name: '关闭侧边栏' }).click();
  await expect(page.getByRole('button', { name: '打开侧边栏' })).toBeFocused();

  await page.getByRole('button', { name: '打开侧边栏' }).click();
  await sidebar.getByRole('link', { name: '用户管理' }).click();
  await expect(page).toHaveURL(/\/admin\/system\/user$/);
  await expect(page.getByRole('button', { name: '打开侧边栏' })).toBeFocused();

  await page.getByRole('button', { name: '打开侧边栏' }).click();
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/profile$/);
  await expect(sidebar).toHaveCount(0);
});
