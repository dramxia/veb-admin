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
import type { RoleDto } from '@veb/api-contracts';
import {
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldCheck,
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
import { AssignAccessDrawer } from './assign-access-drawer';
import { AssignUserDrawer } from './assign-user-drawer';
import { RoleFormModal } from './role-form-modal';

function api<T = unknown>(path: string, init: RequestInit) {
  return requestJson<T>(path, init);
}

export function RoleTable({ roles }: { roles: RoleDto[] }) {
  const { clearError, error, loading, run } = useActionFeedback({
    refresh: true,
  });
  const formModal = useDisclosure();
  const accessDrawer = useDisclosure();
  const userDrawer = useDisclosure();
  const deleteDialog = useDisclosure();
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleDto | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleDto | null>(null);

  return (
    <>
      <DataTableCard
        minW={{ base: '680px', lg: '900px' }}
        title="角色矩阵"
        description="集中维护角色状态、授权范围与用户关联。"
        meta={`${roles.length} 个角色`}
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
                模块数
              </Th>
              <Th isNumeric display={{ base: 'none', md: 'table-cell' }}>
                节点数
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
                        {role._count.users} 个用户 ·{' '}
                        {role.code === 'superadmin'
                          ? '全部模块 · 全部节点'
                          : `${role._count.modules} 个模块 · ${role._count.menus} 个节点`}
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
                    {role.code === 'superadmin' ? '全部' : role._count.modules}
                  </Td>
                  <Td isNumeric display={{ base: 'none', md: 'table-cell' }}>
                    {role.code === 'superadmin' ? '全部' : role._count.menus}
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
                        code="system:role:assign-access"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip={
                          role.code === 'superadmin'
                            ? '查看访问权限'
                            : '配置访问权限'
                        }
                        aria-label={`${role.code === 'superadmin' ? '查看' : '配置'}角色 ${role.name} 的访问权限`}
                        icon={<Icon as={ShieldCheck} boxSize={4} />}
                        isDisabled={loading}
                        onClick={() => {
                          clearError();
                          setSelectedRole(role);
                          accessDrawer.onOpen();
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
            <EmptyTableRow colSpan={8} text="暂无角色数据" />
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
              await api(`/api/v1/system/roles/${editingRole.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
              });
              return;
            }
            await api('/api/v1/system/roles', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
          })
        }
      />

      <AssignAccessDrawer
        isOpen={accessDrawer.isOpen}
        role={selectedRole}
        onClose={accessDrawer.onClose}
      />

      <AssignUserDrawer
        isOpen={userDrawer.isOpen}
        role={selectedRole}
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
            await api(`/api/v1/system/roles/${deletingRole.id}`, {
              method: 'DELETE',
            });
          });
          if (ok) deleteDialog.onClose();
        }}
      />
    </>
  );
}
