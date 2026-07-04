'use client';

import { Badge, Icon, Table, Tbody, Td, Th, Thead, Tr, useDisclosure } from '@chakra-ui/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  DataTableCard,
  EmptyTableRow,
  TableActions,
} from '@/components/common/data-table';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';
import { PermissionFormModal } from './permission-form-modal';

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
  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [deletingPermission, setDeletingPermission] = useState<Permission | null>(null);

  return (
    <>
      <DataTableCard
        minW="760px"
        toolbar={
          <AuthButton
            code="system:permission:create"
            isLoading={loading}
            icon={<Icon as={Plus} boxSize={4} />}
            onClick={() => {
              setEditingPermission(null);
              formModal.onOpen();
            }}
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
                        intent="neutral"
                        variant="ghost"
                        tooltip="编辑权限"
                        icon={<Icon as={Pencil} boxSize={4} />}
                        isDisabled={loading}
                        onClick={() => {
                          setEditingPermission(permission);
                          formModal.onOpen();
                        }}
                      />
                      <AuthButton
                        code="system:permission:delete"
                        size="xs"
                        intent="danger"
                        variant="ghost"
                        tooltip="删除权限"
                        icon={<Icon as={Trash2} boxSize={4} />}
                        isDisabled={loading || permission.isSystem}
                        onClick={() => {
                          setDeletingPermission(permission);
                          deleteDialog.onOpen();
                        }}
                      />
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

      <PermissionFormModal
        isOpen={formModal.isOpen}
        isLoading={loading}
        permission={editingPermission}
        onClose={formModal.onClose}
        onSubmit={(payload) =>
          run(async () => {
            if (editingPermission) {
              await api(`/api/system/permissions/${editingPermission.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
              });
              return;
            }
            await api('/api/system/permissions', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
          })
        }
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="删除权限"
        description={`确认删除权限 ${deletingPermission?.code ?? ''}？该操作会影响后续授权配置。`}
        confirmLabel="删除"
        intent="danger"
        isLoading={loading}
        onClose={deleteDialog.onClose}
        onConfirm={async () => {
          const ok = await run(async () => {
            if (!deletingPermission) return;
            await api(`/api/system/permissions/${deletingPermission.id}`, { method: 'DELETE' });
          });
          if (ok) deleteDialog.onClose();
        }}
      />
    </>
  );
}

