'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Button,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import type { PermissionDto } from '@veb/api-contracts';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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

const permissionTypeLabels: Record<string, string> = {
  BUTTON: '按钮',
  MENU: '菜单',
};

function api<T = unknown>(path: string, init: RequestInit) {
  return requestJson<T>(path, init);
}

export function PermissionTable({
  permissions,
}: {
  permissions: PermissionDto[];
}) {
  const { clearError, error, loading, run } = useActionFeedback({
    refresh: true,
  });
  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const [query, setQuery] = useState('');
  const [editingPermission, setEditingPermission] =
    useState<PermissionDto | null>(null);
  const [deletingPermission, setDeletingPermission] =
    useState<PermissionDto | null>(null);

  const filteredPermissions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return permissions;
    return permissions.filter((permission) =>
      `${permission.code} ${permission.name} ${permission.description ?? ''}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [permissions, query]);

  return (
    <>
      <DataTableCard
        minW="760px"
        title="权限码"
        description="维护菜单与按钮级权限码，为角色授权提供稳定的能力清单。"
        meta={`${filteredPermissions.length} / ${permissions.length} 个权限码`}
        toolbar={
          <Stack spacing={3}>
            {error ? (
              <Alert status="error" aria-live="polite">
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <InputGroup maxW={{ base: 'full', md: '360px' }}>
              <InputLeftElement pointerEvents="none" color="ink.400">
                <Icon as={Search} boxSize={4} />
              </InputLeftElement>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索权限码、名称或描述"
                aria-label="搜索权限"
                pl={10}
              />
            </InputGroup>
          </Stack>
        }
        primaryAction={
          <AuthButton
            code="system:permission:create"
            isLoading={loading}
            icon={<Icon as={Plus} boxSize={4} />}
            onClick={() => {
              clearError();
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
              <Th>来源</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {filteredPermissions.length > 0 ? (
            <Tbody>
              {filteredPermissions.map((permission) => (
                <Tr key={permission.id}>
                  <Td fontWeight="700" color="ink.800">
                    {permission.code}
                  </Td>
                  <Td>{permission.name}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        permission.type === 'MENU' ? 'brand' : 'cyan'
                      }
                    >
                      {permissionTypeLabels[permission.type] ?? permission.type}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={permission.isSystem ? 'purple' : 'gray'}
                    >
                      {permission.isSystem ? '系统内置' : '自定义'}
                    </Badge>
                  </Td>
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
                          clearError();
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
                          clearError();
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
            <EmptyTableRow
              colSpan={5}
              text={
                permissions.length === 0 ? '暂无权限数据' : '没有匹配的权限'
              }
              description={
                permissions.length === 0
                  ? '新增权限后，可将其分配给角色。'
                  : '请调整搜索关键词后重试。'
              }
              action={
                permissions.length > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuery('')}
                  >
                    清除搜索
                  </Button>
                ) : undefined
              }
            />
          )}
        </Table>
      </DataTableCard>

      <PermissionFormModal
        isOpen={formModal.isOpen}
        isLoading={loading}
        error={error}
        permission={editingPermission}
        onClose={() => {
          clearError();
          formModal.onClose();
        }}
        onSubmit={(payload) =>
          run(async () => {
            if (editingPermission) {
              await api(`/api/v1/system/permissions/${editingPermission.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
              });
              return;
            }
            await api('/api/v1/system/permissions', {
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
        error={error}
        confirmLabel="删除"
        intent="danger"
        isLoading={loading}
        onClose={() => {
          clearError();
          deleteDialog.onClose();
        }}
        onConfirm={async () => {
          const ok = await run(async () => {
            if (!deletingPermission) return;
            await api(`/api/v1/system/permissions/${deletingPermission.id}`, {
              method: 'DELETE',
            });
          });
          if (ok) deleteDialog.onClose();
        }}
      />
    </>
  );
}
