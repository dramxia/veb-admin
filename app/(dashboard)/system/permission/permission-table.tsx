'use client';

import { Badge, Box, HStack, Table, Tbody, Td, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { AuthButton } from '@/components/auth/auth-button';

type Permission = { id: string; code: string; name: string; type: string; description: string | null; isSystem: boolean };
async function api(path: string, init: RequestInit) {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  const json = await res.json();
  if (!res.ok || json.code !== 0) throw new Error(json.message || '操作失败');
  return json.data;
}
export function PermissionTable({ permissions }: { permissions: Permission[] }) {
  const router = useRouter(); const toast = useToast();
  async function run(action: () => Promise<void>) { try { await action(); toast({ title: '操作成功', status: 'success' }); router.refresh(); } catch (e) { toast({ title: e instanceof Error ? e.message : '操作失败', status: 'error' }); } }
  return <Box bg="white" borderWidth="1px" rounded="lg" overflow="hidden">
    <HStack p={4}><AuthButton code="system:permission:create" colorScheme="blue" onClick={() => run(async () => {
      const code = prompt('权限码，如 system:demo:view'); if (!code) return;
      const name = prompt('权限名称', code) || code;
      const type = (prompt('类型 MENU 或 BUTTON', 'BUTTON') || 'BUTTON').toUpperCase();
      await api('/api/system/permissions', { method: 'POST', body: JSON.stringify({ code, name, type }) });
    })}>新增权限</AuthButton></HStack>
    <Table size="sm"><Thead><Tr><Th>权限码</Th><Th>名称</Th><Th>类型</Th><Th>系统</Th><Th>操作</Th></Tr></Thead><Tbody>{permissions.map((p) => <Tr key={p.id}>
      <Td>{p.code}</Td><Td>{p.name}</Td><Td><Badge>{p.type}</Badge></Td><Td>{p.isSystem ? '是' : '否'}</Td>
      <Td><HStack><AuthButton code="system:permission:update" size="xs" onClick={() => run(async () => { const name = prompt('权限名称', p.name); if (name === null) return; await api(`/api/system/permissions/${p.id}`, { method: 'PATCH', body: JSON.stringify({ name }) }); })}>编辑</AuthButton>
      <AuthButton code="system:permission:delete" size="xs" colorScheme="red" variant="outline" onClick={() => run(async () => { if (!confirm(`确认删除权限 ${p.code}？`)) return; await api(`/api/system/permissions/${p.id}`, { method: 'DELETE' }); })}>删除</AuthButton></HStack></Td>
    </Tr>)}</Tbody></Table>
  </Box>;
}
