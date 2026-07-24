import { randomUUID } from 'node:crypto';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { login } from './helpers';

type ApiEnvelope<T> = {
  code: number;
  data: T | null;
  message: string;
};

type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type AppModule = {
  id: string;
  code: string;
  name: string;
  sort: number;
};

type Menu = {
  id: string;
  moduleId: string;
  parentId: string | null;
  name: string;
  type: 'DIR' | 'PAGE' | 'LINK' | 'BUTTON';
  permissionCode: string | null;
};

type Role = {
  id: string;
  modules?: Array<{
    moduleId: string;
    menuIds: string[];
  }>;
};

type User = { id: string };

type NavigationMenu = {
  id: string;
  type: Menu['type'];
  children: NavigationMenu[];
};

type Navigation = {
  modules: Array<{
    id: string;
    code: string;
    landingPath: string;
    menus: NavigationMenu[];
  }>;
  permissionCodes: string[];
};

async function expectOk<T>(response: {
  status(): number;
  json(): Promise<unknown>;
}) {
  expect(response.status()).toBe(200);
  const payload = (await response.json()) as ApiEnvelope<T>;
  expect(payload.code).toBe(0);
  expect(payload.data).not.toBeNull();
  return payload.data as T;
}

async function loginAtLanding(
  page: Page,
  username: string,
  password: string,
  landingPath: string,
) {
  await page.goto('/login');
  await page.getByLabel(/用户名|Username/i).fill(username);
  await page.getByLabel(/密码|Password/i).fill(password);
  await page.getByRole('button', { name: /登录|Sign in/i }).click();
  await page.waitForURL((url) => url.pathname === landingPath);
}

function flattenNavigationMenus(menus: NavigationMenu[]): NavigationMenu[] {
  return menus.flatMap((menu) => [
    menu,
    ...flattenNavigationMenus(menu.children),
  ]);
}

test('module PAGE and BUTTON access is assigned and revoked atomically', async ({
  browser,
  page,
}, testInfo) => {
  test.setTimeout(150_000);
  await login(page);

  const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
  const moduleCode = `e2e${suffix}`;
  const roleCode = `e2erole${suffix}`;
  const username = `e2e_module_${suffix}`;
  const password = `E2e@${suffix}`;
  const pagePermissionCode = `${moduleCode}:page-view`;
  const buttonPermissionCode = `${moduleCode}:page-operate`;
  const menuPath = `/api-docs/feature-${suffix}`;
  let restrictedContext: BrowserContext | undefined;
  let moduleId: string | undefined;
  let pageMenuId: string | undefined;
  let buttonMenuId: string | undefined;
  let roleId: string | undefined;
  let userId: string | undefined;

  try {
    const modulePage = await expectOk<PageResult<AppModule>>(
      await page.request.get('/api/v1/system/modules?page=1&pageSize=100'),
    );
    const adminModule = modulePage.items.find(
      (appModule) => appModule.code === 'admin',
    );
    expect(adminModule, 'seeded admin module').toBeTruthy();
    if (!adminModule) throw new Error('Seeded admin module is missing');

    const adminMenus = await expectOk<{ items: Menu[] }>(
      await page.request.get(
        `/api/v1/system/menus?moduleId=${encodeURIComponent(adminModule.id)}`,
      ),
    );
    const modulePageMenu = adminMenus.items.find(
      (menu) =>
        menu.type === 'PAGE' && menu.permissionCode === 'system:module:view',
    );
    const moduleUpdateButton = adminMenus.items.find(
      (menu) =>
        menu.type === 'BUTTON' &&
        menu.permissionCode === 'system:module:update',
    );
    expect(modulePageMenu, 'module management PAGE').toBeTruthy();
    expect(moduleUpdateButton, 'module update BUTTON').toBeTruthy();
    expect(moduleUpdateButton?.parentId).toBe(modulePageMenu?.id);
    if (!modulePageMenu || !moduleUpdateButton) {
      throw new Error('Seeded module management PAGE or BUTTON is missing');
    }

    const createdModule = await expectOk<AppModule>(
      await page.request.post('/api/v1/system/modules', {
        data: {
          code: moduleCode,
          name: `跨区域经营分析与协同工作模块 ${suffix}`,
          description: `E2E 动态模块 ${suffix}`,
          sort: -100,
          status: 'ENABLED',
        },
      }),
    );
    moduleId = createdModule.id;

    const pageMenu = await expectOk<Menu>(
      await page.request.post('/api/v1/system/menus', {
        data: {
          moduleId,
          name: `模块页面 ${suffix}`,
          description: '模块授权后的默认落点',
          path: menuPath,
          component: 'example/page',
          type: 'PAGE',
          permissionCode: pagePermissionCode,
          sort: 10,
          status: 'ENABLED',
          visible: true,
        },
      }),
    );
    pageMenuId = pageMenu.id;

    const buttonMenu = await expectOk<Menu>(
      await page.request.post('/api/v1/system/menus', {
        data: {
          moduleId,
          parentId: pageMenu.id,
          name: `执行分析 ${suffix}`,
          description: '页面内操作权限',
          type: 'BUTTON',
          permissionCode: buttonPermissionCode,
          sort: 10,
          status: 'ENABLED',
        },
      }),
    );
    buttonMenuId = buttonMenu.id;
    expect(buttonMenu.parentId).toBe(pageMenu.id);

    const role = await expectOk<Role>(
      await page.request.post('/api/v1/system/roles', {
        data: {
          code: roleCode,
          name: `模块验收角色 ${suffix}`,
          status: 'ENABLED',
          sort: 50,
        },
      }),
    );
    roleId = role.id;

    const buttonWithoutPage = await page.request.put(
      `/api/v1/system/roles/${roleId}/access`,
      {
        data: {
          modules: [{ moduleId, menuIds: [buttonMenu.id] }],
        },
      },
    );
    expect(buttonWithoutPage.status()).toBe(400);
    const roleAfterRejectedAccess = await expectOk<{
      assignments: Role['modules'];
    }>(await page.request.get(`/api/v1/system/roles/${roleId}/access`));
    expect(roleAfterRejectedAccess.assignments).toEqual([]);

    await expectOk(
      await page.request.put(`/api/v1/system/roles/${roleId}/access`, {
        data: {
          modules: [
            { moduleId, menuIds: [pageMenu.id] },
            {
              moduleId: adminModule.id,
              menuIds: [modulePageMenu.id],
            },
          ],
        },
      }),
    );

    const user = await expectOk<User>(
      await page.request.post('/api/v1/system/users', {
        data: {
          username,
          password,
          nickname: `模块验收用户 ${suffix}`,
          status: 'ENABLED',
        },
      }),
    );
    userId = user.id;
    await expectOk(
      await page.request.post(`/api/v1/system/users/${userId}/assign-roles`, {
        data: { roleIds: [roleId] },
      }),
    );

    const baseURL = String(
      testInfo.project.use.baseURL || 'http://127.0.0.1:1066',
    );
    restrictedContext = await browser.newContext({ baseURL });
    const restrictedPage = await restrictedContext.newPage();
    await loginAtLanding(restrictedPage, username, password, menuPath);
    await expect(
      restrictedPage.getByRole('heading', { name: '动态模块示例' }),
    ).toBeVisible();

    const pageOnlyNavigation = await expectOk<Navigation>(
      await restrictedPage.request.get('/api/v1/navigation'),
    );
    expect(pageOnlyNavigation.modules[0]).toMatchObject({
      id: moduleId,
      code: moduleCode,
      landingPath: menuPath,
    });
    expect(pageOnlyNavigation.permissionCodes).toContain(pagePermissionCode);
    expect(pageOnlyNavigation.permissionCodes).not.toContain(
      buttonPermissionCode,
    );
    expect(
      pageOnlyNavigation.modules
        .flatMap((appModule) => flattenNavigationMenus(appModule.menus))
        .some((menu) => menu.type === 'BUTTON'),
    ).toBe(false);

    await restrictedPage.goto('/admin/system/module');
    await expect(
      restrictedPage.getByRole('heading', { name: '模块管理' }),
    ).toBeVisible();
    await expect(
      restrictedPage.getByRole('button', { name: '编辑模块' }),
    ).toHaveCount(0);
    const forbiddenUpdate = await restrictedPage.request.patch(
      `/api/v1/system/modules/${moduleId}`,
      { data: { sort: createdModule.sort } },
    );
    expect(forbiddenUpdate.status()).toBe(403);

    await expectOk(
      await page.request.put(`/api/v1/system/roles/${roleId}/access`, {
        data: {
          modules: [
            { moduleId, menuIds: [pageMenu.id, buttonMenu.id] },
            {
              moduleId: adminModule.id,
              menuIds: [modulePageMenu.id, moduleUpdateButton.id],
            },
          ],
        },
      }),
    );

    const navigationWithButtons = await expectOk<Navigation>(
      await restrictedPage.request.get('/api/v1/navigation'),
    );
    expect(navigationWithButtons.permissionCodes).toEqual(
      expect.arrayContaining([
        pagePermissionCode,
        buttonPermissionCode,
        'system:module:view',
        'system:module:update',
      ]),
    );
    expect(
      navigationWithButtons.modules
        .flatMap((appModule) => flattenNavigationMenus(appModule.menus))
        .some((menu) => menu.type === 'BUTTON'),
    ).toBe(false);

    await expectOk(
      await page.request.patch(`/api/v1/system/menus/${pageMenuId}`, {
        data: { type: 'PAGE', visible: false },
      }),
    );
    const hiddenNavigation = await expectOk<Navigation>(
      await restrictedPage.request.get('/api/v1/navigation'),
    );
    expect(hiddenNavigation.modules.some((item) => item.id === moduleId)).toBe(
      false,
    );
    expect(hiddenNavigation.permissionCodes).toEqual(
      expect.arrayContaining([pagePermissionCode, buttonPermissionCode]),
    );
    const hiddenPage = await restrictedPage.goto(menuPath);
    expect(hiddenPage?.status()).toBe(200);
    await expect(
      restrictedPage.getByRole('heading', { name: '动态模块示例' }),
    ).toBeVisible();
    await expectOk(
      await page.request.patch(`/api/v1/system/menus/${pageMenuId}`, {
        data: { type: 'PAGE', visible: true },
      }),
    );

    await restrictedPage.goto('/admin/system/module');
    await expect(
      restrictedPage.getByRole('button', { name: '编辑模块' }).first(),
    ).toBeVisible();
    await expectOk(
      await restrictedPage.request.patch(`/api/v1/system/modules/${moduleId}`, {
        data: { sort: createdModule.sort },
      }),
    );

    await expectOk(
      await page.request.put(`/api/v1/system/roles/${roleId}/access`, {
        data: { modules: [] },
      }),
    );

    const navigationAfterRevocation = await expectOk<Navigation>(
      await restrictedPage.request.get('/api/v1/navigation'),
    );
    expect(navigationAfterRevocation.modules).toEqual([]);
    expect(navigationAfterRevocation.permissionCodes).toEqual([]);

    const revokedPage = await restrictedPage.goto(menuPath);
    expect(revokedPage?.status()).toBe(403);
    await expect(
      restrictedPage.getByRole('heading', {
        name: '你没有权限访问该页面',
      }),
    ).toBeVisible();
    const updateAfterRevocation = await restrictedPage.request.patch(
      `/api/v1/system/modules/${moduleId}`,
      { data: { sort: createdModule.sort } },
    );
    expect(updateAfterRevocation.status()).toBe(403);

    const roleAfterRevocation = await expectOk<{
      assignments: Role['modules'];
    }>(await page.request.get(`/api/v1/system/roles/${roleId}/access`));
    expect(roleAfterRevocation.assignments).toEqual([]);
  } finally {
    await restrictedContext?.close().catch(() => undefined);
    if (userId) {
      await page.request
        .delete(`/api/v1/system/users/${userId}`)
        .catch(() => undefined);
    }
    if (roleId) {
      await page.request
        .delete(`/api/v1/system/roles/${roleId}`)
        .catch(() => undefined);
    }
    if (buttonMenuId) {
      await page.request
        .delete(`/api/v1/system/menus/${buttonMenuId}`)
        .catch(() => undefined);
    }
    if (pageMenuId) {
      await page.request
        .delete(`/api/v1/system/menus/${pageMenuId}`)
        .catch(() => undefined);
    }
    if (moduleId) {
      await page.request
        .delete(`/api/v1/system/modules/${moduleId}`)
        .catch(() => undefined);
    }
  }
});
