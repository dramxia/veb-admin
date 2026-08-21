'use client';

import {
  Badge,
  Button,
  Link,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import type { OperationLogDto } from '@veb/api-contracts';
import { DownloadIcon } from '@/assets/icons';
import { LocalIcon } from '@/components/common/local-icon';
import { useSearchParams } from 'next/navigation';
import { Auth } from '@/components/auth/auth';
import { DataTableCard, EmptyTableRow } from '@/components/common/data-table';
import { OperationLogFilter } from './log-filter';

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

export function OperationLogTable({ logs }: { logs: OperationLogDto[] }) {
  const searchParams = useSearchParams();
  const exportHref = `/api/v1/system/logs/operation/export?${searchParams.toString()}`;

  return (
    <DataTableCard
      minW="1040px"
      title="操作日志"
      description="追踪后台关键操作、执行结果和访问来源，用于审计与问题排查。"
      meta={`${logs.length} 条最近记录`}
      primaryAction={
        <Auth code="log:operation:export">
          <Button
            as={Link}
            href={exportHref}
            leftIcon={<LocalIcon icon={DownloadIcon} />}
            variant="outline"
          >
            导出 CSV
          </Button>
        </Auth>
      }
      toolbar={<OperationLogFilter />}
    >
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>时间</Th>
            <Th>操作者</Th>
            <Th>动作</Th>
            <Th>目标</Th>
            <Th>状态</Th>
            <Th>IP</Th>
            <Th>消息</Th>
          </Tr>
        </Thead>
        {logs.length > 0 ? (
          <Tbody>
            {logs.map((log) => (
              <Tr key={log.id}>
                <Td whiteSpace="nowrap">{formatTime(log.createdAt)}</Td>
                <Td>
                  {log.actor?.nickname ||
                    log.actor?.username ||
                    log.actorId ||
                    '-'}
                </Td>
                <Td>{log.action}</Td>
                <Td>{log.target || '-'}</Td>
                <Td>
                  <Badge
                    colorScheme={log.status === 'SUCCESS' ? 'green' : 'red'}
                  >
                    {log.status === 'SUCCESS' ? '成功' : '失败'}
                  </Badge>
                </Td>
                <Td>{log.ip || '-'}</Td>
                <Td>{log.message || '-'}</Td>
              </Tr>
            ))}
          </Tbody>
        ) : (
          <EmptyTableRow
            colSpan={7}
            text="暂无操作日志"
            description="请调整筛选条件，或等待新的后台操作记录。"
          />
        )}
      </Table>
    </DataTableCard>
  );
}
