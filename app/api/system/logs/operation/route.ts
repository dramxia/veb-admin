export const dynamic = 'force-dynamic';

import { LogStatus, Prisma } from '@prisma/client';
import { ok, parsePage, withApi } from '@/lib/api';
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

export const GET = withApi(async (request: Request) => {
  await requirePermission('log:operation:view');
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip } = parsePage(searchParams);
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
    ...(startAt || endAt ? { createdAt: { ...(startAt ? { gte: startAt } : {}), ...(endAt ? { lte: endAt } : {}) } } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.operationLog.count({ where }),
    prisma.operationLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, username: true, nickname: true } } },
    }),
  ]);

  return ok({ items, total, page, pageSize });
});
