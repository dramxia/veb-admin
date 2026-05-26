export const dynamic = 'force-dynamic';

import { LogStatus, Prisma } from '@prisma/client';
import { withApi } from '@/lib/api';
import { ParamError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';

function parseDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ParamError('时间参数格式不正确');
  return date;
}

function parseStatus(value: string | null) {
  if (!value) return undefined;
  if (!Object.values(LogStatus).includes(value as LogStatus)) throw new ParamError('日志状态不正确');
  return value as LogStatus;
}

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export const GET = withApi(async (request: Request) => {
  await requirePermission('log:operation:export');
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword')?.trim();
  const actorId = searchParams.get('actorId')?.trim();
  const action = searchParams.get('action')?.trim();
  const status = parseStatus(searchParams.get('status'));
  const startAt = parseDate(searchParams.get('startAt'));
  const endAt = parseDate(searchParams.get('endAt'));

  const where: Prisma.OperationLogWhereInput = {
    ...(actorId ? { actorId } : {}),
    ...(action ? { action: { contains: action } } : {}),
    ...(status ? { status } : {}),
    ...(keyword ? { OR: [{ action: { contains: keyword } }, { target: { contains: keyword } }, { message: { contains: keyword } }] } : {}),
    ...(startAt || endAt ? { createdAt: { ...(startAt ? { gte: startAt } : {}), ...(endAt ? { lte: endAt } : {}) } } : {}),
  };

  const items = await prisma.operationLog.findMany({
    where,
    take: 5000,
    orderBy: { createdAt: 'desc' },
    include: { actor: { select: { username: true, nickname: true } } },
  });

  const rows = [
    ['createdAt', 'actor', 'action', 'target', 'status', 'ip', 'userAgent', 'message'],
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
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');

  return new Response(`\ufeff${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="operation-logs.csv"',
    },
  });
});
