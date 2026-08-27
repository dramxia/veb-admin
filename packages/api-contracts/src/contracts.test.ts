import { describe, expect, it } from 'vitest';
import {
  ERROR_CODES,
  adminArticleDetailSchema,
  appModuleCreateInputSchema,
  apiResultSchema,
  createApiError,
  createApiSuccess,
  dashboardStatsSchema,
  fileListQuerySchema,
  fileReadQuerySchema,
  pageResultSchema,
  paginationQuerySchema,
  publicArticleDetailSchema,
  likeListQuerySchema,
  menuCreateInputSchema,
  menuManagementListSchema,
  menuUpdateInputSchema,
  roleAccessDetailDtoSchema,
  roleAccessUpdateInputSchema,
  roleDetailDtoSchema,
  roleDtoSchema,
  roleListQuerySchema,
  roleUserAssignmentDetailDtoSchema,
  userCreateInputSchema,
  userNavigationSchema,
  vebUserSchema,
} from './index';

describe('API envelope', () => {
  it('validates success and error results', () => {
    const schema = apiResultSchema(pageResultSchema(vebUserSchema));
    const success = createApiSuccess({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    const failure = createApiError(ERROR_CODES.FORBIDDEN, '无权限');

    expect(schema.parse(success)).toEqual(success);
    expect(schema.parse(failure)).toEqual(failure);
  });

  it('rejects an error response with non-null data', () => {
    const schema = apiResultSchema(vebUserSchema);
    expect(
      schema.safeParse({
        code: ERROR_CODES.NOT_FOUND,
        data: {},
        message: 'not found',
      }).success,
    ).toBe(false);
  });
});

describe('pagination', () => {
  it('coerces query strings and supplies defaults', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(paginationQuerySchema.parse({ page: '2', pageSize: '50' })).toEqual({
      page: 2,
      pageSize: 50,
    });
  });

  it('rejects invalid bounds and fractional values', () => {
    expect(paginationQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ pageSize: 101 }).success).toBe(
      false,
    );
    expect(paginationQuerySchema.safeParse({ page: 1.5 }).success).toBe(false);
  });

  it('requires HTTP date filters to carry an ISO 8601 timezone', () => {
    expect(
      likeListQuerySchema.safeParse({ from: '2026-07-22T00:00:00.000Z' })
        .success,
    ).toBe(true);
    expect(
      likeListQuerySchema.safeParse({ from: '2026-07-22T00:00:00' }).success,
    ).toBe(false);
  });

  it('rejects malformed VEB pagination and file query values', () => {
    expect(roleListQuerySchema.safeParse({ page: 'NaN' }).success).toBe(false);
    expect(fileListQuerySchema.safeParse({ pageSize: '101' }).success).toBe(
      false,
    );
    expect(fileReadQuerySchema.safeParse({ download: 'yes' }).success).toBe(
      false,
    );
    expect(fileReadQuerySchema.parse({})).toEqual({ download: '0' });
  });
});

describe('service DTO boundaries', () => {
  it('keeps the dashboard resource and activity snapshot explicit', () => {
    const stats = {
      userCount: 12,
      enabledUserCount: 10,
      roleCount: 4,
      enabledRoleCount: 3,
      moduleCount: 3,
      enabledModuleCount: 3,
      permissionCount: 28,
      menuCount: 14,
      operationCount24h: 9,
      failedOperationCount24h: 1,
    };

    expect(dashboardStatsSchema.parse(stats)).toEqual(stats);
    expect(
      dashboardStatsSchema.safeParse({ ...stats, serviceHealthy: true })
        .success,
    ).toBe(false);
  });

  it('keeps the canonical navigation response shape', () => {
    const menu = {
      id: 'menu-dashboard',
      moduleId: 'module-dashboard',
      parentId: null,
      name: '仪表盘',
      description: null,
      path: '/dashboard',
      component: 'dashboard/page',
      icon: null,
      sort: 0,
      type: 'PAGE' as const,
      permissionCode: 'dashboard:view',
      visible: true,
      status: 'ENABLED' as const,
      externalUrl: null,
      children: [],
    };
    const navigation = {
      modules: [
        {
          id: 'module-dashboard',
          code: 'dashboard',
          name: '仪表盘',
          description: null,
          icon: null,
          sort: 0,
          status: 'ENABLED' as const,
          isSystem: true,
          landingPath: '/dashboard',
          menus: [menu],
        },
      ],
      permissionCodes: ['dashboard:view'],
      roleCodes: ['user'],
    };

    expect(userNavigationSchema.parse(navigation)).toEqual(navigation);
    expect(
      userNavigationSchema.safeParse({ ...navigation, menus: [menu] }).success,
    ).toBe(false);
  });

  it('does not accept a password hash in a VEB user DTO', () => {
    const result = vebUserSchema.safeParse({
      id: 'user-1',
      username: 'admin',
      email: null,
      nickname: null,
      avatar: null,
      status: 'ENABLED',
      lastLoginAt: null,
      createdAt: '2026-07-22T00:00:00.000Z',
      updatedAt: '2026-07-22T00:00:00.000Z',
      roles: [],
      passwordHash: 'secret',
    });

    expect(result.success).toBe(false);
  });

  it('rejects internal fields in a public article DTO', () => {
    const publicArticle = {
      title: 'A public post',
      slug: 'public-post',
      summary: null,
      publishedAt: '2026-07-22T00:00:00.000Z',
      updatedAt: '2026-07-22T00:00:00.000Z',
      authorNickname: 'Editor',
      tags: [{ name: 'News', slug: 'news' }],
      likeCount: 1,
      commentCount: 0,
      contentMarkdown: '# Post',
    };

    expect(publicArticleDetailSchema.parse(publicArticle)).toEqual(
      publicArticle,
    );
    expect(
      publicArticleDetailSchema.safeParse({
        ...publicArticle,
        id: 'article-1',
        status: 'PUBLISHED',
        authorUsername: 'admin',
      }).success,
    ).toBe(false);
  });

  it('requires a concrete system user on admin article DTOs', () => {
    const article = {
      id: 'article-1',
      title: 'A managed post',
      slug: 'managed-post',
      summary: null,
      status: 'DRAFT' as const,
      publishedAt: null,
      createdAt: '2026-07-22T00:00:00.000Z',
      updatedAt: '2026-07-22T00:00:00.000Z',
      author: { id: 'user-1', username: 'admin', nickname: 'Editor' },
      tags: [],
      likeCount: 0,
      commentCount: 0,
      contentMarkdown: '# Draft',
    };

    expect(adminArticleDetailSchema.parse(article)).toEqual(article);
    expect(
      adminArticleDetailSchema.safeParse({ ...article, author: null }).success,
    ).toBe(false);
  });

  it('matches the VEB user and role assignment response shapes', () => {
    const timestamp = '2026-07-22T00:00:00.000Z';
    const user = {
      id: 'user-1',
      username: 'admin',
      email: null,
      nickname: 'Admin',
      avatar: null,
      status: 'ENABLED',
      lastLoginAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      roles: [{ role: { id: 'role-1', code: 'admin', name: '管理员' } }],
    };
    const role = {
      id: 'role-1',
      code: 'admin',
      name: '管理员',
      description: null,
      status: 'ENABLED',
      sort: 0,
      isSystem: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      _count: { users: 1, menus: 2, modules: 1 },
    };
    const { _count, ...roleDetailBase } = role;
    const { roles, ...assignedUser } = user;
    void _count;
    void roles;

    expect(vebUserSchema.parse(user)).toEqual(user);
    expect(roleDtoSchema.parse(role)).toEqual(role);
    expect(
      roleDetailDtoSchema.parse({
        ...roleDetailBase,
        modules: [
          {
            moduleId: 'module-1',
            module: {
              id: 'module-1',
              code: 'admin',
              name: '后台',
              description: null,
              icon: null,
              sort: 0,
              status: 'ENABLED',
              isSystem: true,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            menuIds: ['menu-user', 'button-user-create'],
          },
        ],
        users: [{ userId: 'user-1', roleId: 'role-1', user: assignedUser }],
      }),
    ).toBeDefined();
  });

  it('keeps role assignment detail responses scoped to each dedicated drawer', () => {
    const accessDetail = {
      id: 'role-1',
      assignments: [
        { moduleId: 'module-1', menuIds: ['menu-user', 'button-user-create'] },
      ],
      modules: [
        {
          id: 'module-1',
          name: '系统管理',
          status: 'ENABLED' as const,
          _count: { menus: 1, buttons: 1 },
        },
      ],
      menus: [
        {
          id: 'menu-user',
          moduleId: 'module-1',
          parentId: null,
          name: '用户管理',
          path: '/admin/system/user',
          sort: 1,
          type: 'PAGE' as const,
          permissionCode: 'system:user:view',
          visible: true,
          status: 'ENABLED' as const,
          externalUrl: null,
        },
      ],
    };
    const userDetail = {
      id: 'role-1',
      userIds: ['user-1'],
      users: [
        {
          id: 'user-1',
          username: 'admin',
          nickname: 'Admin',
          status: 'ENABLED' as const,
        },
      ],
    };

    expect(roleAccessDetailDtoSchema.parse(accessDetail)).toEqual(accessDetail);
    expect(roleUserAssignmentDetailDtoSchema.parse(userDetail)).toEqual(
      userDetail,
    );
    expect(
      roleUserAssignmentDetailDtoSchema.safeParse({
        ...userDetail,
        users: [{ ...userDetail.users[0], email: 'admin@example.com' }],
      }).success,
    ).toBe(false);
  });

  it('keeps password validation at the contract boundary', () => {
    expect(
      userCreateInputSchema.safeParse({ username: 'admin', password: 'short' })
        .success,
    ).toBe(false);
  });
});

describe('menu inputs', () => {
  const pageMenu = {
    moduleId: 'module-1',
    name: '用户管理',
    path: '/admin/system/user',
    component: 'system/user/page',
    type: 'PAGE' as const,
    permissionCode: 'system:user:view',
  };

  it('limits menu management module options to the fields needed by the menu UI', () => {
    expect(
      menuManagementListSchema.parse({
        items: [],
        modules: [{ id: 'module-1', name: '系统管理' }],
      }),
    ).toEqual({
      items: [],
      modules: [{ id: 'module-1', name: '系统管理' }],
    });
    expect(
      menuManagementListSchema.safeParse({
        items: [],
        modules: [
          { id: 'module-1', name: '系统管理', description: '不应暴露' },
        ],
      }).success,
    ).toBe(false);
  });

  it('accepts canonical absolute page paths without a module registry', () => {
    expect(menuCreateInputSchema.safeParse(pageMenu).success).toBe(true);
    expect(
      menuCreateInputSchema.safeParse({ ...pageMenu, path: '/system/user' })
        .success,
    ).toBe(true);
    expect(
      menuUpdateInputSchema.safeParse({
        type: 'PAGE',
        path: '/content/article',
      }).success,
    ).toBe(true);
  });

  it('rejects admin-looking paths that browsers normalize elsewhere', () => {
    for (const path of [
      '/admin/../articles',
      '/admin/%2e%2e/articles',
      '/admin//system/user',
      '/admin/system/user/',
      '/admin/system/user?tab=roles',
      '/admin/system/user#roles',
    ]) {
      expect(
        menuCreateInputSchema.safeParse({ ...pageMenu, path }).success,
        path,
      ).toBe(false);
    }
  });

  it('keeps LINK and BUTTON fields separate from page routing', () => {
    expect(
      menuCreateInputSchema.safeParse({
        moduleId: 'module-1',
        name: '项目文档',
        type: 'LINK',
        externalUrl: 'https://example.com/docs',
        permissionCode: 'docs:view',
      }).success,
    ).toBe(true);
    expect(
      menuCreateInputSchema.safeParse({
        moduleId: 'module-1',
        name: '项目文档',
        path: 'https://example.com/docs',
        type: 'LINK',
        externalUrl: 'https://example.com/docs',
        permissionCode: 'docs:view',
      }).success,
    ).toBe(false);

    expect(
      menuCreateInputSchema.safeParse({
        moduleId: 'module-1',
        parentId: 'menu-user',
        name: '新增用户',
        type: 'BUTTON',
        permissionCode: 'system:user:create',
      }).success,
    ).toBe(true);
    expect(
      menuCreateInputSchema.safeParse({
        moduleId: 'module-1',
        parentId: 'menu-user',
        name: '新增用户',
        type: 'BUTTON',
        permissionCode: 'system:user:create',
        path: '/forbidden',
      }).success,
    ).toBe(false);
    expect(
      menuUpdateInputSchema.safeParse({
        type: 'BUTTON',
        name: '新增用户',
        path: '/forbidden',
      }).success,
    ).toBe(false);
    expect(
      menuUpdateInputSchema.safeParse({
        name: '缺少节点类型',
      }).success,
    ).toBe(false);
  });

  it('accepts paths in any non-reserved workspace namespace', () => {
    expect(
      menuCreateInputSchema.safeParse({
        ...pageMenu,
        path: '/example/report',
      }).success,
    ).toBe(true);
  });
});

describe('application module inputs', () => {
  it('creates metadata-only modules and rejects component registration fields', () => {
    const moduleInput = {
      code: 'example',
      name: '示例模块',
    };

    expect(appModuleCreateInputSchema.safeParse(moduleInput).success).toBe(
      true,
    );
    expect(
      appModuleCreateInputSchema.safeParse({
        ...moduleInput,
        componentKey: 'unknown/home',
      }).success,
    ).toBe(false);
  });

  it('validates an atomic module and menu access replacement', () => {
    expect(
      roleAccessUpdateInputSchema.parse({
        modules: [
          {
            moduleId: 'module-1',
            menuIds: ['menu-report', 'button-report-export'],
          },
        ],
      }),
    ).toEqual({
      modules: [
        {
          moduleId: 'module-1',
          menuIds: ['menu-report', 'button-report-export'],
        },
      ],
    });
  });
});
