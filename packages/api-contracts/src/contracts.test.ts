import { describe, expect, it } from 'vitest';
import {
  ERROR_CODES,
  apiResultSchema,
  createApiError,
  createApiSuccess,
  fileListQuerySchema,
  fileReadQuerySchema,
  pageResultSchema,
  paginationQuerySchema,
  publicArticleDetailSchema,
  likeListQuerySchema,
  roleDetailDtoSchema,
  roleDtoSchema,
  roleListQuerySchema,
  userCreateInputSchema,
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
      _count: { users: 1, permissions: 1 },
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
        permissions: [
          {
            roleId: 'role-1',
            permissionId: 'permission-1',
            permission: {
              id: 'permission-1',
              code: 'system:user:view',
              name: '查看用户',
              type: 'BUTTON',
              description: null,
              parentId: null,
              isSystem: true,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
        ],
        users: [{ userId: 'user-1', roleId: 'role-1', user: assignedUser }],
      }),
    ).toBeDefined();
  });

  it('keeps password validation at the contract boundary', () => {
    expect(
      userCreateInputSchema.safeParse({ username: 'admin', password: 'short' })
        .success,
    ).toBe(false);
  });
});
