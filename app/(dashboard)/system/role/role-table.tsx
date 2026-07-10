'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import {
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Auth } from '@/components/auth/auth';
import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  DataTableCard,
  EmptyTableRow,
  TableActions,
} from '@/components/common/data-table';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';
import { AssignPermissionDrawer } from './assign-permission-drawer';
import { AssignUserDrawer } from './assign-user-drawer';
import { RoleFormModal } from './role-form-modal';

type Role = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  sort: number;
  isSystem: boolean;
  _count: { users: number; permissions: number };
};
type Permission = { id: string; code: string; name: string; type: string };
type User = { id: string; username: string; nickname: string | null };

function api<T = unknown>(path: string, init: RequestInit) {
  return requestJson<T>(path, init);
}

export function RoleTable({
  roles,
  permissions,
  users,
}: {
  roles: Role[];
  permissions: Permission[];
  users: User[];
}) {
  const { clearError, error, loading, run } = useActionFeedback({
    refresh: true,
  });
  const formModal = useDisclosure();
  const permissionDrawer = useDisclosure();
  const userDrawer = useDisclosure();
  const deleteDialog = useDisclosure();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  return (
    <>
      <DataTableCard
        minW={{ base: '680px', lg: '900px' }}
        title="角色矩阵"
        description="集中维护角色状态、授权范围与用户关联。"
        meta={`${roles.length} 个角色 · ${permissions.length} 个权限 · ${users.length} 个用户`}
        toolbar={
          error ? (
            <Alert status="error" aria-live="polite">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : undefined
        }
        primaryAction={
          <AuthButton
            code="system:role:create"
            isLoading={loading}
            icon={<Icon as={Plus} boxSize={4} />}
            onClick={() => {
              clearError();
              setEditingRole(null);
              formModal.onOpen();
            }}
          >
            新增角色
          </AuthButton>
        }
      >
        <Table size="sm" aria-label="角色授权矩阵">
          <Thead>
            <Tr>
              <Th>编码</Th>
              <Th>名称</Th>
              <Th>状态</Th>
              <Th isNumeric display={{ base: 'none', md: 'table-cell' }}>
                用户数
              </Th>
              <Th isNumeric display={{ base: 'none', md: 'table-cell' }}>
                权限数
              </Th>
              <Th display={{ base: 'none', lg: 'table-cell' }}>归属</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {roles.length > 0 ? (
            <Tbody>
              {roles.map((role) => (
                <Tr key={role.id}>
                  <Td>
                    <Text
                      color="ink.700"
                      fontWeight="700"
                      wordBreak="break-all"
                    >
                      {role.code}
                    </Text>
                  </Td>
                  <Td>
                    <Stack spacing={1} minW="140px">
                      <Text color="ink.800" fontWeight="800">
                        {role.name}
                      </Text>
                      <Text
                        display={{ base: 'block', md: 'none' }}
                        color="ink.500"
                        fontSize="xs"
                      >
                        {role._count.users} 个用户 · {role._count.permissions}{' '}
                        个权限
                      </Text>
                    </Stack>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={role.status === 'ENABLED' ? 'green' : 'red'}
                    >
                      {role.status === 'ENABLED' ? '启用' : '停用'}
                    </Badge>
                  </Td>
                  <Td isNumeric display={{ base: 'none', md: 'table-cell' }}>
                    {role._count.users}
                  </Td>
                  <Td isNumeric display={{ base: 'none', md: 'table-cell' }}>
                    {role._count.permissions}
                  </Td>
                  <Td display={{ base: 'none', lg: 'table-cell' }}>
                    <Badge colorScheme={role.isSystem ? 'purple' : 'gray'}>
                      {role.isSystem ? '系统内置' : '自定义'}
                    </Badge>
                  </Td>
                  <Td>
                    <TableActions>
                      <AuthButton
                        code="system:role:update"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="编辑角色"
                        aria-label={`编辑角色 ${role.name}`}
                        icon={<Icon as={Pencil} boxSize={4} />}
                        isDisabled={loading}
                        onClick={() => {
                          clearError();
                          setEditingRole(role);
                          formModal.onOpen();
                        }}
                      />
                      <AuthButton
                        code="system:role:assign-permission"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="分配权限"
                        aria-label={`为角色 ${role.name} 分配权限`}
                        icon={<Icon as={KeyRound} boxSize={4} />}
                        isDisabled={loading}
                        onClick={() => {
                          clearError();
                          setSelectedRole(role);
                          permissionDrawer.onOpen();
                        }}
                      />
                      <Menu placement="bottom-end" strategy="fixed">
                        <MenuButton
                          as={IconButton}
                          size="xs"
                          variant="ghost"
                          aria-label={`更多角色操作：${role.name}`}
                          icon={<Icon as={MoreHorizontal} boxSize={4} />}
                          isDisabled={loading}
                        />
                        <Portal>
                          <MenuList>
                            <Auth code="system:role:assign-user">
                              <MenuItem
                                icon={<Icon as={Users} boxSize={4} />}
                                isDisabled={loading}
                                onClick={() => {
                                  clearError();
                                  setSelectedRole(role);
                                  userDrawer.onOpen();
                                }}
                              >
                                分配用户
                              </MenuItem>
                            </Auth>
                            <Auth code="system:role:delete">
                              <MenuItem
                                icon={<Icon as={Trash2} boxSize={4} />}
                                color="red.600"
                                isDisabled={loading || role.isSystem}
                                onClick={() => {
                                  clearError();
                                  setDeletingRole(role);
                                  deleteDialog.onOpen();
                                }}
                              >
                                删除角色
                              </MenuItem>
                            </Auth>
                          </MenuList>
                        </Portal>
                      </Menu>
                    </TableActions>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          ) : (
            <EmptyTableRow colSpan={7} text="暂无角色数据" />
          )}
        </Table>
      </DataTableCard>

      <RoleFormModal
        isOpen={formModal.isOpen}
        isLoading={loading}
        role={editingRole}
        onClose={() => {
          clearError();
          formModal.onClose();
        }}
        onSubmit={(payload) =>
          run(async () => {
            if (editingRole) {
              await api(`/api/system/roles/${editingRole.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
              });
              return;
            }
            await api('/api/system/roles', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
          })
        }
      />

      <AssignPermissionDrawer
        isOpen={permissionDrawer.isOpen}
        role={selectedRole}
        permissions={permissions}
        onClose={permissionDrawer.onClose}
      />

      <AssignUserDrawer
        isOpen={userDrawer.isOpen}
        role={selectedRole}
        users={users}
        onClose={userDrawer.onClose}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="删除角色"
        description={`确认删除角色 ${deletingRole?.name ?? ''}？有关联用户的角色会被后端拒绝删除。`}
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
            if (!deletingRole) return;
            await api(`/api/system/roles/${deletingRole.id}`, {
              method: 'DELETE',
            });
          });
          if (ok) deleteDialog.onClose();
        }}
      />
    </>
  );
}
