import type { OperationLogQuery } from '@veb/api-contracts';
import { LogStatus, type Prisma } from '@/generated/client';
import { prisma } from '@/lib/prisma';

type JsonValue = Prisma.InputJsonValue;

export type LogOperationInput = {
  actorId?: string | null;
  action: string;
  target?: string | null;
  payload?: JsonValue | null;
  status: LogStatus;
  message?: string | null;
  req?: Request | null;
};

type OperationLogFilters = {
  keyword?: string;
  actorId?: string;
  action?: string;
  status?: LogStatus;
  startAt?: Date;
  endAt?: Date;
};

type OperationLogListQuery = OperationLogFilters & {
  page: number;
  pageSize: number;
  skip: number;
};

function getClientIp(req?: Request | null) {
  if (!req) return null;
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null
  );
}

function operationLogWhere({
  keyword,
  actorId,
  action,
  status,
  startAt,
  endAt,
}: OperationLogFilters): Prisma.OperationLogWhereInput {
  return {
    ...(actorId ? { actorId } : {}),
    ...(action ? { action: { contains: action } } : {}),
    ...(status ? { status } : {}),
    ...(keyword
      ? {
          OR: [
            { action: { contains: keyword } },
            { target: { contains: keyword } },
            { message: { contains: keyword } },
            { actor: { username: { contains: keyword, mode: 'insensitive' } } },
            { actor: { nickname: { contains: keyword, mode: 'insensitive' } } },
          ],
        }
      : {}),
    ...(startAt || endAt
      ? {
          createdAt: {
            ...(startAt ? { gte: startAt } : {}),
            ...(endAt ? { lte: endAt } : {}),
          },
        }
      : {}),
  };
}

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function operationLogFiltersFromQuery(
  query: OperationLogQuery,
): OperationLogFilters {
  return {
    keyword: query.keyword,
    actorId: query.actorId,
    action: query.action,
    status: query.status,
    startAt: query.startAt ? new Date(query.startAt) : undefined,
    endAt: query.endAt ? new Date(query.endAt) : undefined,
  };
}

export async function listOperationLogs({
  page,
  pageSize,
  skip,
  ...filters
}: OperationLogListQuery) {
  const where = operationLogWhere(filters);
  const [total, items] = await Promise.all([
    prisma.operationLog.count({ where }),
    prisma.operationLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, username: true, nickname: true } },
      },
    }),
  ]);
  return { items, total, page, pageSize };
}

export async function exportOperationLogs(filters: OperationLogFilters) {
  const items = await prisma.operationLog.findMany({
    where: operationLogWhere(filters),
    take: 5000,
    orderBy: { createdAt: 'desc' },
    include: { actor: { select: { username: true, nickname: true } } },
  });
  const rows = [
    [
      'createdAt',
      'actor',
      'action',
      'target',
      'status',
      'ip',
      'userAgent',
      'message',
    ],
    ...items.map((item) => [
      item.createdAt.toISOString(),
      item.actor?.nickname || item.actor?.username || item.actorId || '',
      item.action,
      item.target || '',
      item.status,
      item.ip || '',
      item.userAgent || '',
      item.message || '',
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

export async function logOperation({
  actorId,
  action,
  target,
  payload,
  status,
  message,
  req,
}: LogOperationInput) {
  try {
    await prisma.operationLog.create({
      data: {
        actorId: actorId || null,
        action,
        target: target || null,
        ip: getClientIp(req),
        userAgent: req?.headers.get('user-agent') || null,
        payload: payload ?? undefined,
        status,
        message: message || null,
      },
    });
  } catch (error) {
    console.error('[operation-log:error]', error);
  }
}
