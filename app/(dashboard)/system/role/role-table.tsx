'use client';

import { Badge, Box, HStack, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { AuthButton } from '@/components/auth/auth-button';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';

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

function parseIdList(value: string) {
  return value.split(',').map((id) => id.trim()).filter(Boolean);
}

export function RoleTable({ roles, permissions, users }: { roles: Role[]; permissions: Permission[]; users: User[] }) {
  const { loading, run } = useActionFeedback({ refresh: true });

  return (
    <Box bg="white" borderWidth="1px" rounded="lg" overflow="hidden">
      <HStack p={4}>
        <AuthButton code="system:role:create" isLoading={loading} onClick={() => run(async () => {
          const code = prompt('角色编码，如 manager');
          if (!code) return;
          const name = prompt('角色名称', code) || code;
          await api('/api/system/roles', { method: 'POST', body: JSON.stringify({ code, name, status: 'ENABLED', sort: 0 }) });
        })}>新增角色</AuthButton>
      </HStack>
      <Table size="sm">
        <Thead>
          <Tr><Th>编码</Th><Th>名称</Th><Th>状态</Th><Th>用户数</Th><Th>权限数</Th><Th>系统</Th><Th>操作</Th></Tr>
        </Thead>
        <Tbody>
          {roles.map((role) => (
            <Tr key={role.id}>
              <Td>{role.code}</Td>
              <Td>{role.name}</Td>
              <Td><Badge colorScheme={role.status === 'ENABLED' ? 'green' : 'red'}>{role.status}</Badge></Td>
              <Td>{role._count.users}</Td>
              <Td>{role._count.permissions}</Td>
              <Td>{role.isSystem ? '是' : '否'}</Td>
              <Td>
                <HStack>
                  <AuthButton code="system:role:update" size="xs" isDisabled={loading} onClick={() => run(async () => {
                    const name = prompt('角色名称', role.name);
                    if (name === null) return;
                    await api(`/api/system/roles/${role.id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
                  })}>编辑</AuthButton>
                  <AuthButton code="system:role:assign-permission" size="xs" isDisabled={loading} onClick={() => run(async () => {
                    const ids = prompt(`权限ID，逗号分隔：\n${permissions.map((p) => `${p.code}: ${p.id}`).join('\n')}`);
                    if (ids === null) return;
                    await api(`/api/system/roles/${role.id}/permissions`, {
                      method: 'POST',
                      body: JSON.stringify({ permissionIds: parseIdList(ids) }),
                    });
                  })}>权限</AuthButton>
                  <AuthButton code="system:role:assign-user" size="xs" isDisabled={loading} onClick={() => run(async () => {
                    const ids = prompt(`用户ID，逗号分隔：\n${users.map((u) => `${u.nickname || u.username}: ${u.id}`).join('\n')}`);
                    if (ids === null) return;
                    await api(`/api/system/roles/${role.id}/users`, {
                      method: 'POST',
                      body: JSON.stringify({ userIds: parseIdList(ids) }),
                    });
                  })}>用户</AuthButton>
                  <AuthButton code="system:role:delete" size="xs" colorScheme="red" variant="outline" isDisabled={loading} onClick={() => run(async () => {
                    if (!confirm(`确认删除角色 ${role.name}？`)) return;
                    await api(`/api/system/roles/${role.id}`, { method: 'DELETE' });
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
