'use client';

import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { AuthButton } from '@/components/auth/auth-button';
import {
  DataTableCard,
  EmptyTableRow,
  TableActions,
} from '@/components/common/data-table';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';

type Permission = {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  isSystem: boolean;
};

function api<T = unknown>(path: string, init: RequestInit) {
  return requestJson<T>(path, init);
}

export function PermissionTable({
  permissions,
}: {
  permissions: Permission[];
}) {
  const { loading, run } = useActionFeedback({ refresh: true });

  return (
    <DataTableCard
      minW="760px"
      toolbar={
        <AuthButton
          code="system:permission:create"
          isLoading={loading}
          onClick={() =>
            run(async () => {
              const code = prompt('权限码，如 system:demo:view');
              if (!code) return;
              const name = prompt('权限名称', code) || code;
              const type = (
                prompt('类型 MENU 或 BUTTON', 'BUTTON') || 'BUTTON'
              ).toUpperCase();
              await api('/api/system/permissions', {
                method: 'POST',
                body: JSON.stringify({ code, name, type }),
              });
            })
          }
        >
          新增权限
        </AuthButton>
      }
    >
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>权限码</Th>
            <Th>名称</Th>
            <Th>类型</Th>
            <Th>系统</Th>
            <Th>操作</Th>
          </Tr>
        </Thead>
        {permissions.length > 0 ? (
          <Tbody>
            {permissions.map((permission) => (
              <Tr key={permission.id}>
                <Td>{permission.code}</Td>
                <Td>{permission.name}</Td>
                <Td>
                  <Badge>{permission.type}</Badge>
                </Td>
                <Td>{permission.isSystem ? '是' : '否'}</Td>
                <Td>
                  <TableActions>
                    <AuthButton
                      code="system:permission:update"
                      size="xs"
                      isDisabled={loading}
                      onClick={() =>
                        run(async () => {
                          const name = prompt('权限名称', permission.name);
                          if (name === null) return;
                          await api(
                            `/api/system/permissions/${permission.id}`,
                            { method: 'PATCH', body: JSON.stringify({ name }) },
                          );
                        })
                      }
                    >
                      编辑
                    </AuthButton>
                    <AuthButton
                      code="system:permission:delete"
                      size="xs"
                      colorScheme="red"
                      variant="outline"
                      isDisabled={loading}
                      onClick={() =>
                        run(async () => {
                          if (!confirm(`确认删除权限 ${permission.code}？`))
                            return;
                          await api(
                            `/api/system/permissions/${permission.id}`,
                            { method: 'DELETE' },
                          );
                        })
                      }
                    >
                      删除
                    </AuthButton>
                  </TableActions>
                </Td>
              </Tr>
            ))}
          </Tbody>
        ) : (
          <EmptyTableRow colSpan={5} text="暂无权限数据" />
        )}
      </Table>
    </DataTableCard>
  );
}
