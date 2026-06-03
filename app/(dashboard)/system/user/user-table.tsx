'use client';

import { Badge, Box, HStack, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { AuthButton } from '@/components/auth/auth-button';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';

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

function parseIdList(value: string) {
  return value.split(',').map((id) => id.trim()).filter(Boolean);
}

export function UserTable({ users, roles }: { users: User[]; roles: Role[] }) {
  const { loading, run } = useActionFeedback({ refresh: true });

  return (
    <Box bg="white" borderWidth="1px" rounded="lg" overflow="hidden">
      <HStack p={4} justify="space-between">
        <AuthButton
          code="system:user:create"
          isLoading={loading}
          onClick={() => run(async () => {
            const username = prompt('用户名');
            if (!username) return;
            const password = prompt('初始密码', 'Admin@123') || 'Admin@123';
            await api('/api/system/users', {
              method: 'POST',
              body: JSON.stringify({ username, password, nickname: username, roleIds: [] }),
            });
          })}
        >
          新增用户
        </AuthButton>
      </HStack>
      <Table size="sm">
        <Thead>
          <Tr><Th>用户名</Th><Th>昵称</Th><Th>邮箱</Th><Th>角色</Th><Th>状态</Th><Th>操作</Th></Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td>{user.username}</Td>
              <Td>{user.nickname || '-'}</Td>
              <Td>{user.email || '-'}</Td>
              <Td>{user.roles.map((item) => item.role.name).join(', ') || '-'}</Td>
              <Td><Badge colorScheme={user.status === 'ENABLED' ? 'green' : 'red'}>{user.status}</Badge></Td>
              <Td>
                <HStack>
                  <AuthButton code="system:user:update" size="xs" isDisabled={loading} onClick={() => run(async () => {
                    const nickname = prompt('昵称', user.nickname || user.username);
                    if (nickname === null) return;
                    await api(`/api/system/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ nickname }) });
                  })}>编辑</AuthButton>
                  <AuthButton code="system:user:reset-password" size="xs" isDisabled={loading} onClick={() => run(async () => {
                    const password = prompt('新密码', 'Admin@123');
                    if (!password) return;
                    await api(`/api/system/users/${user.id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) });
                  })}>改密</AuthButton>
                  <AuthButton code="system:user:assign-role" size="xs" isDisabled={loading} onClick={() => run(async () => {
                    const roleText = prompt(
                      `角色ID，逗号分隔：\n${roles.map((role) => `${role.name}: ${role.id}`).join('\n')}`,
                      user.roles.map((item) => item.role.id).join(','),
                    );
                    if (roleText === null) return;
                    await api(`/api/system/users/${user.id}/assign-roles`, {
                      method: 'POST',
                      body: JSON.stringify({ roleIds: parseIdList(roleText) }),
                    });
                  })}>角色</AuthButton>
                  <AuthButton code="system:user:delete" size="xs" colorScheme="red" variant="outline" isDisabled={loading} onClick={() => run(async () => {
                    if (!confirm(`确认删除用户 ${user.username}？`)) return;
                    await api(`/api/system/users/${user.id}`, { method: 'DELETE' });
                  })}>删除</AuthButton>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
