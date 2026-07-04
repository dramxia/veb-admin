'use client';

import {
  Badge,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import { KeyRound, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
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
import { AssignRolesModal } from './assign-roles-modal';
import { UserFormModal } from './user-form-modal';

type Role = { id: string; code: string; name: string };
type User = {
  id: string;
  username: string;
  email: string | null;
  nickname: string | null;
  status: string;
  roles: { role: Role }[];
};

function api<T = unknown>(path: string, init: RequestInit) {
  return requestJson<T>(path, init);
}

function ResetPasswordModal({
  isOpen,
  isLoading,
  user,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  isLoading?: boolean;
  user: User | null;
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
      <ModalOverlay bg="rgba(23, 33, 29, 0.24)" backdropFilter="blur(16px)" />
      <ModalContent
        rounded="3xl"
        bg="rgba(255,255,255,0.86)"
        borderWidth="1px"
        borderColor="rgba(255,255,255,0.78)"
        boxShadow="glass"
        sx={{
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        }}
      >
        <form action={handleSubmit}>
          <ModalHeader>重置密码</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>{user?.nickname || user?.username || '用户'} 的新密码</FormLabel>
              <Input name="password" defaultValue="Admin@123" type="password" />
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
        </form>
      </ModalContent>
    </Modal>
  );
}

export function UserTable({ users, roles }: { users: User[]; roles: Role[] }) {
  const { loading, run } = useActionFeedback({ refresh: true });
  const formModal = useDisclosure();
  const assignModal = useDisclosure();
  const resetModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  return (
    <>
      <DataTableCard
        minW="920px"
        title="用户账号"
        description="集中维护登录账号、角色分配与账号状态，确保后台访问边界清晰。"
        meta={`${users.length} 个账号 · ${roles.length} 个可分配角色`}
        primaryAction={
          <AuthButton
            code="system:user:create"
            isLoading={loading}
            icon={<Icon as={Plus} boxSize={4} />}
            onClick={() => {
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
          {users.length > 0 ? (
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.username}</Td>
                  <Td>{user.nickname || '-'}</Td>
                  <Td>{user.email || '-'}</Td>
                  <Td>
                    {user.roles.map((item) => item.role.name).join(', ') || '-'}
                  </Td>
                  <Td>
                    <Badge colorScheme={user.status === 'ENABLED' ? 'green' : 'red'}>
                      {user.status}
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
                          setEditingUser(user);
                          formModal.onOpen();
                        }}
                      />
                      <AuthButton
                        code="system:user:reset-password"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="重置密码"
                        icon={<Icon as={KeyRound} boxSize={4} />}
                        isDisabled={loading}
                        onClick={() => {
                          setResettingUser(user);
                          resetModal.onOpen();
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
                          setAssigningUser(user);
                          assignModal.onOpen();
                        }}
                      />
                      <AuthButton
                        code="system:user:delete"
                        size="xs"
                        intent="danger"
                        variant="ghost"
                        tooltip="删除用户"
                        icon={<Icon as={Trash2} boxSize={4} />}
                        isDisabled={loading}
                        onClick={() => {
                          setDeletingUser(user);
                          deleteDialog.onOpen();
                        }}
                      />
                    </TableActions>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          ) : (
            <EmptyTableRow colSpan={6} text="暂无用户数据" />
          )}
        </Table>
      </DataTableCard>

      <UserFormModal
        isOpen={formModal.isOpen}
        isLoading={loading}
        user={editingUser}
        roles={roles}
        onClose={formModal.onClose}
        onSubmit={(payload) =>
          run(async () => {
            if (editingUser) {
              await api(`/api/system/users/${editingUser.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
              });
              return;
            }
            await api('/api/system/users', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
          })
        }
      />

      <AssignRolesModal
        isOpen={assignModal.isOpen}
        isLoading={loading}
        user={assigningUser}
        roles={roles}
        onClose={assignModal.onClose}
        onSubmit={(roleIds) =>
          run(async () => {
            if (!assigningUser) return;
            await api(`/api/system/users/${assigningUser.id}/assign-roles`, {
              method: 'POST',
              body: JSON.stringify({ roleIds }),
            });
          })
        }
      />

      <ResetPasswordModal
        isOpen={resetModal.isOpen}
        isLoading={loading}
        user={resettingUser}
        onClose={resetModal.onClose}
        onSubmit={(password) =>
          run(async () => {
            if (!resettingUser) return;
            await api(`/api/system/users/${resettingUser.id}/reset-password`, {
              method: 'POST',
              body: JSON.stringify({ password }),
            });
          })
        }
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="删除用户"
        description={`确认删除用户 ${deletingUser?.username ?? ''}？该操作不可撤销。`}
        confirmLabel="删除"
        intent="danger"
        isLoading={loading}
        onClose={deleteDialog.onClose}
        onConfirm={async () => {
          const ok = await run(async () => {
            if (!deletingUser) return;
            await api(`/api/system/users/${deletingUser.id}`, { method: 'DELETE' });
          });
          if (ok) deleteDialog.onClose();
        }}
      />
    </>
  );
}
