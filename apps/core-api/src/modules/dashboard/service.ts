import { Prisma, type LogStatus } from '@/generated/client';
import { prisma } from '@/lib/prisma';

const TREND_DAY_COUNT = 7;

type OperationTrendRow = {
  date: string;
  status: LogStatus;
  count: number;
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date, dayOffset = 0) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + dayOffset,
    ),
  );
}

function buildOperationTrend(now: Date, rows: OperationTrendRow[]) {
  const trend = Array.from({ length: TREND_DAY_COUNT }, (_, index) => ({
    date: dateKey(startOfUtcDay(now, index - (TREND_DAY_COUNT - 1))),
    successCount: 0,
    failureCount: 0,
  }));
  const trendByDate = new Map(trend.map((item) => [item.date, item]));

  for (const row of rows) {
    const item = trendByDate.get(row.date);
    if (!item) continue;
    if (row.status === 'SUCCESS') item.successCount = row.count;
    else item.failureCount = row.count;
  }

  return trend;
}

export async function getDashboardStats({
  includeRecentOperations,
}: {
  includeRecentOperations: boolean;
}) {
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const trendSince = startOfUtcDay(now, -(TREND_DAY_COUNT - 1));
  const [
    userCount,
    enabledUserCount,
    roleCount,
    enabledRoleCount,
    moduleCount,
    enabledModuleCount,
    permissionCount,
    menuCount,
    operationCount24h,
    failedOperationCount24h,
    fileCount,
    articleCount,
    publishedArticleCount,
    tagCount,
    likeCount,
    operationTrendRows,
    recentOperations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ENABLED' } }),
    prisma.role.count(),
    prisma.role.count({ where: { status: 'ENABLED' } }),
    prisma.appModule.count(),
    prisma.appModule.count({ where: { status: 'ENABLED' } }),
    prisma.menu.count({ where: { permissionCode: { not: null } } }),
    prisma.menu.count({ where: { type: { in: ['DIR', 'PAGE', 'LINK'] } } }),
    prisma.operationLog.count({ where: { createdAt: { gte: since } } }),
    prisma.operationLog.count({
      where: { createdAt: { gte: since }, status: 'FAILURE' },
    }),
    prisma.file.count(),
    prisma.article.count(),
    prisma.article.count({ where: { status: 'PUBLISHED' } }),
    prisma.tag.count(),
    prisma.articleLike.count(),
    prisma.$queryRaw<OperationTrendRow[]>(Prisma.sql`
      SELECT
        to_char("createdAt", 'YYYY-MM-DD') AS "date",
        "status",
        COUNT(*)::integer AS "count"
      FROM "OperationLog"
      WHERE "createdAt" >= ${trendSince}
      GROUP BY "date", "status"
      ORDER BY "date" ASC
    `),
    includeRecentOperations
      ? prisma.operationLog.findMany({
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
        })
      : Promise.resolve([]),
  ]);

  return {
    generatedAt: now.toISOString(),
    userCount,
    enabledUserCount,
    roleCount,
    enabledRoleCount,
    moduleCount,
    enabledModuleCount,
    permissionCount,
    menuCount,
    operationCount24h,
    failedOperationCount24h,
    fileCount,
    articleCount,
    publishedArticleCount,
    tagCount,
    likeCount,
    operationTrend: buildOperationTrend(now, operationTrendRows),
    recentOperations: recentOperations.map((operation) => ({
      id: operation.id,
      action: operation.action,
      target: operation.target,
      actorName: operation.actor?.nickname || operation.actor?.username || null,
      status: operation.status,
      createdAt: operation.createdAt.toISOString(),
    })),
  };
}
