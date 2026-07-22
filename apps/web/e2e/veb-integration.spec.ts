import { randomUUID } from 'node:crypto';
import { expect, test, type BrowserContext } from '@playwright/test';
import { login } from './helpers';

type ApiEnvelope<T> = {
  code: number;
  data: T | null;
  message: string;
};

type Role = { id: string; code: string; name: string };
type User = {
  id: string;
  username: string;
  nickname: string | null;
  status: 'ENABLED' | 'DISABLED';
  roles: Array<{ role: Role }>;
};
type FileRecord = {
  id: string;
  name: string;
  mime: string;
  size: number;
};
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

test('canonical VEB APIs enforce user, RBAC, and file workflows', async ({
  browser,
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  await login(page);

  const suffix = randomUUID().slice(0, 8);
  const restrictedUsername = `e2e_user_${suffix}`;
  const disabledUsername = `e2e_disabled_${suffix}`;
  const password = `E2e@${suffix}`;
  const userIds = new Set<string>();
  const extraContexts: BrowserContext[] = [];
  let fileId: string | undefined;

  try {
    const rolesResponse = await page.request.get(
      '/api/v1/system/roles?page=1&pageSize=100',
    );
    expect(rolesResponse.status()).toBe(200);
    const roles = (await rolesResponse.json()) as ApiEnvelope<PageResult<Role>>;
    const restrictedRole = roles.data?.items.find(
      (role) => role.code === 'user',
    );
    expect(restrictedRole, 'seeded user role').toBeTruthy();
    if (!restrictedRole) throw new Error('Seeded user role is missing');

    const createRestricted = await page.request.post('/api/v1/system/users', {
      data: {
        username: restrictedUsername,
        password,
        nickname: 'E2E restricted user',
        status: 'ENABLED',
      },
    });
    const restricted = (await createRestricted.json()) as ApiEnvelope<User>;
    const restrictedUserId = restricted.data?.id;
    if (restrictedUserId) userIds.add(restrictedUserId);
    expect(createRestricted.status()).toBe(200);
    expect(restricted.data).toMatchObject({
      username: restrictedUsername,
      status: 'ENABLED',
    });
    if (!restrictedUserId) throw new Error('Created user is missing an id');

    const updateRestricted = await page.request.patch(
      `/api/v1/system/users/${restrictedUserId}`,
      { data: { nickname: 'E2E restricted user updated' } },
    );
    expect(updateRestricted.status()).toBe(200);
    await expect(updateRestricted.json()).resolves.toMatchObject({
      code: 0,
      data: { id: restrictedUserId, nickname: 'E2E restricted user updated' },
    });

    const assignRole = await page.request.post(
      `/api/v1/system/users/${restrictedUserId}/assign-roles`,
      { data: { roleIds: [restrictedRole.id] } },
    );
    expect(assignRole.status()).toBe(200);
    await expect(assignRole.json()).resolves.toMatchObject({
      code: 0,
      data: { id: restrictedUserId, roleIds: [restrictedRole.id] },
    });

    const userDetail = await page.request.get(
      `/api/v1/system/users/${restrictedUserId}`,
    );
    expect(userDetail.status()).toBe(200);
    await expect(userDetail.json()).resolves.toMatchObject({
      code: 0,
      data: { roles: [{ role: { code: 'user' } }] },
    });

    const createDisabled = await page.request.post('/api/v1/system/users', {
      data: {
        username: disabledUsername,
        password,
        nickname: 'E2E disabled user',
        status: 'DISABLED',
      },
    });
    const disabled = (await createDisabled.json()) as ApiEnvelope<User>;
    const disabledUserId = disabled.data?.id;
    if (disabledUserId) userIds.add(disabledUserId);
    expect(createDisabled.status()).toBe(200);
    expect(disabled.data).toMatchObject({
      username: disabledUsername,
      status: 'DISABLED',
    });
    if (!disabledUserId) throw new Error('Disabled user is missing an id');

    const baseURL = String(
      testInfo.project.use.baseURL || 'http://127.0.0.1:1066',
    );
    const disabledContext = await browser.newContext({ baseURL });
    extraContexts.push(disabledContext);
    const disabledPage = await disabledContext.newPage();
    await disabledPage.goto('/login');
    await disabledPage.getByLabel(/用户名|Username/i).fill(disabledUsername);
    await disabledPage.getByLabel(/密码|Password/i).fill(password);
    await disabledPage.getByRole('button', { name: /登录|Sign in/i }).click();
    await expect(disabledPage).toHaveURL(/\/login/);
    await expect(disabledPage.getByRole('alert')).toContainText(
      '账号或密码错误',
    );

    const restrictedContext = await browser.newContext({ baseURL });
    extraContexts.push(restrictedContext);
    const restrictedPage = await restrictedContext.newPage();
    await login(restrictedPage, restrictedUsername, password);
    const forbidden = await restrictedPage.request.post(
      '/api/v1/system/users',
      {
        data: {
          username: `forbidden_${suffix}`,
          password,
          status: 'ENABLED',
        },
      },
    );
    expect(forbidden.status()).toBe(403);
    await expect(forbidden.json()).resolves.toMatchObject({
      data: null,
    });

    const fileContents = `VEB E2E file ${suffix}\n`;
    const upload = await page.request.post('/api/v1/files', {
      multipart: {
        file: {
          name: `veb-e2e-${suffix}.txt`,
          mimeType: 'text/plain',
          buffer: Buffer.from(fileContents),
        },
        scope: 'e2e',
      },
    });
    const uploaded = (await upload.json()) as ApiEnvelope<FileRecord>;
    fileId = uploaded.data?.id;
    expect(upload.status()).toBe(200);
    expect(uploaded.data).toMatchObject({
      name: `veb-e2e-${suffix}.txt`,
      mime: 'text/plain',
      size: Buffer.byteLength(fileContents),
    });
    if (!fileId) throw new Error('Uploaded file is missing an id');

    const fileRead = await page.request.get(`/api/v1/files/${fileId}`);
    expect(fileRead.status()).toBe(200);
    expect(await fileRead.text()).toBe(fileContents);

    const fileDelete = await page.request.delete(`/api/v1/files/${fileId}`);
    expect(fileDelete.status()).toBe(200);
    fileId = undefined;

    await Promise.all(extraContexts.map((context) => context.close()));
    extraContexts.length = 0;

    for (const userId of [disabledUserId, restrictedUserId]) {
      const deletion = await page.request.delete(
        `/api/v1/system/users/${userId}`,
      );
      expect(deletion.status()).toBe(200);
      userIds.delete(userId);
    }
  } finally {
    await Promise.allSettled(extraContexts.map((context) => context.close()));
    if (fileId) {
      await page.request
        .delete(`/api/v1/files/${fileId}`)
        .catch(() => undefined);
    }
    for (const userId of userIds) {
      await page.request
        .delete(`/api/v1/system/users/${userId}`)
        .catch(() => undefined);
    }
  }
});
