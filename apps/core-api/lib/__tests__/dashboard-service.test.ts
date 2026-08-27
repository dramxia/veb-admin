import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userCount: vi.fn(),
  roleCount: vi.fn(),
  moduleCount: vi.fn(),
  menuCount: vi.fn(),
  operationLogCount: vi.fn(),
  operationLogFindMany: vi.fn(),
  fileCount: vi.fn(),
  articleCount: vi.fn(),
  tagCount: vi.fn(),
  articleLikeCount: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock('../prisma', () => ({
  prisma: {
    user: { count: mocks.userCount },
    role: { count: mocks.roleCount },
    appModule: { count: mocks.moduleCount },
    menu: { count: mocks.menuCount },
    operationLog: {
      count: mocks.operationLogCount,
      findMany: mocks.operationLogFindMany,
    },
    file: { count: mocks.fileCount },
    article: { count: mocks.articleCount },
    tag: { count: mocks.tagCount },
    articleLike: { count: mocks.articleLikeCount },
    $queryRaw: mocks.queryRaw,
  },
}));

const { getDashboardStats } =
  await import('../../src/modules/dashboard/service');

describe('dashboard service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-24T12:00:00.000Z'));
    vi.clearAllMocks();
    mocks.userCount.mockResolvedValueOnce(12).mockResolvedValueOnce(10);
    mocks.roleCount.mockResolvedValueOnce(4).mockResolvedValueOnce(3);
    mocks.moduleCount.mockResolvedValueOnce(3).mockResolvedValueOnce(3);
    mocks.menuCount.mockResolvedValueOnce(28).mockResolvedValueOnce(14);
    mocks.operationLogCount.mockResolvedValueOnce(9).mockResolvedValueOnce(1);
    mocks.fileCount.mockResolvedValue(18);
    mocks.articleCount.mockResolvedValueOnce(7).mockResolvedValueOnce(5);
    mocks.tagCount.mockResolvedValue(4);
    mocks.articleLikeCount.mockResolvedValue(32);
    mocks.queryRaw.mockResolvedValue([
      { date: '2026-07-22', status: 'SUCCESS', count: 5 },
      { date: '2026-07-23', status: 'FAILURE', count: 1 },
      { date: '2026-07-23', status: 'SUCCESS', count: 8 },
      { date: '2026-07-24', status: 'SUCCESS', count: 3 },
    ]);
    mocks.operationLogFindMany.mockResolvedValue([
      {
        id: 'log-1',
        action: 'user.update',
        target: 'user-2',
        status: 'SUCCESS',
        createdAt: new Date('2026-07-24T11:45:00.000Z'),
        actor: { username: 'admin', nickname: '管理员' },
      },
      {
        id: 'log-2',
        action: 'blog.article.publish',
        target: 'article-1',
        status: 'FAILURE',
        createdAt: new Date('2026-07-24T11:30:00.000Z'),
        actor: null,
      },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns detailed resource, content, and activity snapshots', async () => {
    await expect(
      getDashboardStats({ includeRecentOperations: true }),
    ).resolves.toEqual({
      generatedAt: '2026-07-24T12:00:00.000Z',
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
      fileCount: 18,
      articleCount: 7,
      publishedArticleCount: 5,
      tagCount: 4,
      likeCount: 32,
      operationTrend: [
        { date: '2026-07-18', successCount: 0, failureCount: 0 },
        { date: '2026-07-19', successCount: 0, failureCount: 0 },
        { date: '2026-07-20', successCount: 0, failureCount: 0 },
        { date: '2026-07-21', successCount: 0, failureCount: 0 },
        { date: '2026-07-22', successCount: 5, failureCount: 0 },
        { date: '2026-07-23', successCount: 8, failureCount: 1 },
        { date: '2026-07-24', successCount: 3, failureCount: 0 },
      ],
      recentOperations: [
        {
          id: 'log-1',
          action: 'user.update',
          target: 'user-2',
          status: 'SUCCESS',
          actorName: '管理员',
          createdAt: '2026-07-24T11:45:00.000Z',
        },
        {
          id: 'log-2',
          action: 'blog.article.publish',
          target: 'article-1',
          status: 'FAILURE',
          actorName: null,
          createdAt: '2026-07-24T11:30:00.000Z',
        },
      ],
    });

    const since = new Date('2026-07-23T12:00:00.000Z');
    expect(mocks.userCount).toHaveBeenNthCalledWith(2, {
      where: { status: 'ENABLED' },
    });
    expect(mocks.roleCount).toHaveBeenNthCalledWith(2, {
      where: { status: 'ENABLED' },
    });
    expect(mocks.moduleCount).toHaveBeenNthCalledWith(2, {
      where: { status: 'ENABLED' },
    });
    expect(mocks.operationLogCount).toHaveBeenNthCalledWith(1, {
      where: { createdAt: { gte: since } },
    });
    expect(mocks.operationLogCount).toHaveBeenNthCalledWith(2, {
      where: { createdAt: { gte: since }, status: 'FAILURE' },
    });
    expect(mocks.articleCount).toHaveBeenNthCalledWith(2, {
      where: { status: 'PUBLISHED' },
    });
    expect(mocks.queryRaw).toHaveBeenCalledOnce();
    expect(mocks.operationLogFindMany).toHaveBeenCalledWith({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        target: true,
        status: true,
        createdAt: true,
        actor: { select: { username: true, nickname: true } },
      },
    });
  });

  it('omits operation detail when the caller lacks log access', async () => {
    const result = await getDashboardStats({ includeRecentOperations: false });

    expect(result.recentOperations).toEqual([]);
    expect(mocks.operationLogFindMany).not.toHaveBeenCalled();
  });
});
