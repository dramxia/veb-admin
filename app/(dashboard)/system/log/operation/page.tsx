export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import { LogStatus, Prisma } from '@prisma/client';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { ParamError } from '@/lib/errors';
import { t } from '@/lib/i18n';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { OperationLogTable } from './log-table';

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ParamError('时间参数格式不正确');
  return date;
}

function parseStatus(value?: string) {
  if (!value) return undefined;
  if (!Object.values(LogStatus).includes(value as LogStatus))
    throw new ParamError('日志状态不正确');
  return value as LogStatus;
}

export default async function OperationLogPage({
  searchParams = {},
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  await requirePermission('log:operation:view');
  const keyword = searchParams.keyword?.trim();
  const actorId = searchParams.actorId?.trim();
  const action = searchParams.action?.trim();
  const status = parseStatus(searchParams.status);
  const startAt = parseDate(searchParams.startAt);
  const endAt = parseDate(searchParams.endAt);

  const where: Prisma.OperationLogWhereInput = {
    ...(actorId ? { actorId } : {}),
    ...(action ? { action: { contains: action } } : {}),
    ...(status ? { status } : {}),
    ...(startAt || endAt
      ? {
          createdAt: {
            ...(startAt ? { gte: startAt } : {}),
            ...(endAt ? { lte: endAt } : {}),
          },
        }
      : {}),
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
  };

  const logs = await prisma.operationLog.findMany({
    where,
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: { actor: { select: { username: true, nickname: true } } },
  });

  return (
    <WorkspaceCanvas
      eyebrow="系统管理"
      title={t('log.title')}
      description={t('log.description')}
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{logs.length} 条最近记录</Badge>
          <Badge colorScheme="gray">最多展示 50 条</Badge>
        </HStack>
      }
    >
      <OperationLogTable logs={logs} />
    </WorkspaceCanvas>
  );
}
