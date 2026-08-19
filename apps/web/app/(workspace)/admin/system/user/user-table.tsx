'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Portal,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import type { RoleDto, VebUser } from '@veb/api-contracts';
import {
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
import { AssignRolesModal } from './assign-roles-modal';
import { UserFormModal } from './user-form-modal';

type RoleSummary = Pick<RoleDto, 'id' | 'code' | 'name'>;

function api<T = unknown>(path: string, init: RequestInit) {
  return requestJson<T>(path, init);
}

function ResetPasswordModal({
  isOpen,
  isLoading,
  error,
  user,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  isLoading?: boolean;
  error?: ReactNode;
  user: VebUser | null;
  onClose: () => void;
  onSubmit: (password: string) => Promise<boolean> | boolean;
}) {
  async function handleSubmit(formData: FormData) {
    const password = String(formData.get('password') || '');
    const ok = await onSubmit(password);
    if (ok) onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <Box
          as="form"
          key={user?.id ?? 'reset-password'}
          action={handleSubmit}
          display="flex"
          flex="1"
          flexDirection="column"
          minH={0}
        >
          <ModalHeader>重置密码</ModalHeader>
          <ModalCloseButton aria-label="关闭密码重置" />
          <ModalBody>
            {error ? (
              <Alert status="error" mb={4} aria-live="polite">
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <FormControl isRequired>
              <FormLabel>
                {user?.nickname || user?.username || '用户'} 的新密码
              </FormLabel>
              <Input
                name="password"
                type="password"
                minLength={6}
                autoComplete="new-password"
                placeholder="至少 6 个字符"
              />
              <FormHelperText>保存后旧密码将立即失效。</FormHelperText>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
                取消
              </Button>
              <Button type="submit" isLoading={isLoading}>
                保存
              </Button>
            </HStack>
          </ModalFooter>
        </Box>
      </ModalContent>
    </Modal>
  );
}

export function UserTable({
  users,
  roles,
}: {
  users: VebUser[];
  roles: RoleSummary[];
}) {
  const { clearError, error, loading, run } = useActionFeedback({
    refresh: true,
  });
  const formModal = useDisclosure();
  const assignModal = useDisclosure();
  const resetModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const [query, setQuery] = useState('');
  const [editingUser, setEditingUser] = useState<VebUser | null>(null);
  const [assigningUser, setAssigningUser] = useState<VebUser | null>(null);
  const [resettingUser, setResettingUser] = useState<VebUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<VebUser | null>(null);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) => {
      const roleNames = user.roles.map((item) => item.role.name).join(' ');
      return `${user.username} ${user.nickname ?? ''} ${user.email ?? ''} ${roleNames}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [query, users]);

  return (
    <>
      <DataTableCard
        minW="920px"
        title="用户账号"
        description="维护登录账号、角色分配与启停状态。"
        meta={`${filteredUsers.length} / ${users.length} 个账号 · ${roles.length} 个角色`}
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
                placeholder="搜索用户名、昵称、邮箱或角色"
                aria-label="搜索用户"
                pl={10}
              />
            </InputGroup>
          </Stack>
        }
        primaryAction={
          <AuthButton
            code="system:user:create"
            isLoading={loading}
            icon={<Icon as={Plus} boxSize={4} />}
            onClick={() => {
              clearError();
              setEditingUser(null);
              formModal.onOpen();
            }}
          >
            新增用户
          </AuthButton>
        }
      >
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>用户名</Th>
              <Th>昵称</Th>
              <Th>邮箱</Th>
              <Th>角色</Th>
              <Th>状态</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {filteredUsers.length > 0 ? (
            <Tbody>
              {filteredUsers.map((user) => (
                <Tr key={user.id}>
                  <Td fontWeight="700" color="ink.800">
                    {user.username}
                  </Td>
                  <Td>{user.nickname || '-'}</Td>
                  <Td>{user.email || '-'}</Td>
                  <Td>
                    {user.roles.map((item) => item.role.name).join('、') || '-'}
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={user.status === 'ENABLED' ? 'green' : 'red'}
                    >
                      {user.status === 'ENABLED' ? '已启用' : '已停用'}
                    </Badge>
                  </Td>
                  <Td>
                    <TableActions>
                      <AuthButton
                        code="system:user:update"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="编辑用户"
                        icon={<Icon as={Pencil} boxSize={4} />}
                        isDisabled={loading}
                        onClick={() => {
                          clearError();
                          setEditingUser(user);
                          formModal.onOpen();
                        }}
                      />
                      <AuthButton
                        code="system:user:assign-role"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="分配角色"
                        icon={<Icon as={ShieldCheck} boxSize={4} />}
                        isDisabled={loading}
                        onClick={() => {
                          clearError();
                          setAssigningUser(user);
                          assignModal.onOpen();
                        }}
                      />
                      <Menu placement="bottom-end" strategy="fixed">
                        <MenuButton
                          as={IconButton}
                          size="xs"
                          variant="ghost"
                          aria-label={`更多用户操作：${user.username}`}
                          icon={<Icon as={MoreHorizontal} boxSize={4} />}
                          isDisabled={loading}
                        />
                        <Portal>
                          <MenuList>
                            <Auth code="system:user:reset-password">
                              <MenuItem
                                icon={<Icon as={KeyRound} boxSize={4} />}
                                onClick={() => {
                                  clearError();
                                  setResettingUser(user);
                                  resetModal.onOpen();
                                }}
                              >
                                重置密码
                              </MenuItem>
                            </Auth>
                            <Auth code="system:user:delete">
                              <MenuItem
                                icon={<Icon as={Trash2} boxSize={4} />}
                                color="statusDanger"
                                onClick={() => {
                                  clearError();
                                  setDeletingUser(user);
                                  deleteDialog.onOpen();
                                }}
                              >
                                删除用户
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
            <EmptyTableRow
              colSpan={6}
              text={users.length === 0 ? '暂无用户数据' : '没有匹配的用户'}
              description={
                users.length === 0
                  ? '创建首个用户后，可在这里分配角色和管理账号状态。'
                  : '请调整搜索关键词后重试。'
              }
              action={
                users.length > 0 ? (
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

      <UserFormModal
        isOpen={formModal.isOpen}
        isLoading={loading}
        error={error}
        user={editingUser}
        roles={roles}
        onClose={() => {
          clearError();
          formModal.onClose();
        }}
        onSubmit={(payload) =>
          run(async () => {
            if (editingUser) {
              await api(`/api/v1/system/users/${editingUser.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
              });
              return;
            }
            await api('/api/v1/system/users', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
          })
        }
      />

      <AssignRolesModal
        isOpen={assignModal.isOpen}
        isLoading={loading}
        error={error}
        user={assigningUser}
        roles={roles}
        onClose={() => {
          clearError();
          assignModal.onClose();
        }}
        onSubmit={(roleIds) =>
          run(async () => {
            if (!assigningUser) return;
            await api(`/api/v1/system/users/${assigningUser.id}/assign-roles`, {
              method: 'POST',
              body: JSON.stringify({ roleIds }),
            });
          })
        }
      />

      <ResetPasswordModal
        isOpen={resetModal.isOpen}
        isLoading={loading}
        error={error}
        user={resettingUser}
        onClose={() => {
          clearError();
          resetModal.onClose();
        }}
        onSubmit={(password) =>
          run(async () => {
            if (!resettingUser) return;
            await api(
              `/api/v1/system/users/${resettingUser.id}/reset-password`,
              {
                method: 'POST',
                body: JSON.stringify({ password }),
              },
            );
          })
        }
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="删除用户"
        description={`确认删除用户 ${deletingUser?.username ?? ''}？该操作不可撤销。`}
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
            if (!deletingUser) return;
            await api(`/api/v1/system/users/${deletingUser.id}`, {
              method: 'DELETE',
            });
          });
          if (ok) deleteDialog.onClose();
        }}
      />
    </>
  );
}
