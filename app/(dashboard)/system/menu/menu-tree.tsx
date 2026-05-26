'use client';

import { Badge, Box, HStack, Table, Tbody, Td, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { AuthButton } from '@/components/auth/auth-button';

type Menu = {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  component: string | null;
  sort: number;
  type: string;
  permissionCode: string | null;
  visible: boolean;
  status: string;
  isSystem: boolean;
};
type Permission = { code: string; name: string };

async function api(path: string, init: RequestInit) {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  const json = await res.json();
  if (!res.ok || json.code !== 0) throw new Error(json.message || '操作失败');
  return json.data;
}

function depthOf(menu: Menu, all: Menu[]) {
  let depth = 1;
  let parentId = menu.parentId;
  while (parentId) {
    const parent = all.find((item) => item.id === parentId);
    if (!parent) break;
    depth += 1;
    parentId = parent.parentId;
  }
  return depth;
}

export function MenuTree({ menus, permissions }: { menus: Menu[]; permissions: Permission[] }) {
  const router = useRouter();
  const toast = useToast();
  const sorted = [...menus].sort((a, b) => depthOf(a, menus) - depthOf(b, menus) || a.sort - b.sort);

  async function run(action: () => Promise<void>) {
    try { await action(); toast({ title: '操作成功', status: 'success' }); router.refresh(); }
    catch (error) { toast({ title: error instanceof Error ? error.message : '操作失败', status: 'error' }); }
  }

  return (
    <Box bg="white" borderWidth="1px" rounded="lg" overflow="hidden">
      <HStack p={4}>
        <AuthButton code="system:menu:create" colorScheme="blue" onClick={() => run(async () => {
          const name = prompt('菜单名称');
          if (!name) return;
          const path = prompt('路径，如 /system/demo');
          if (!path) return;
          const type = (prompt('类型 DIR/PAGE/LINK', 'PAGE') || 'PAGE').toUpperCase();
          const permissionCode = prompt(`MENU 权限码：\n${permissions.map((p) => `${p.name}: ${p.code}`).join('\n')}`, permissions[0]?.code || '') || null;
          const parentId = prompt(`父菜单ID，可空：\n${menus.map((m) => `${m.name}: ${m.id}`).join('\n')}`, '') || null;
          const component = type === 'PAGE' ? (prompt('组件标识，如 example/page', 'example/page') || null) : null;
          await api('/api/system/menus', { method: 'POST', body: JSON.stringify({ name, path, type, permissionCode, parentId, component, visible: true, status: 'ENABLED', sort: 0 }) });
        })}>新增菜单</AuthButton>
      </HStack>
      <Table size="sm">
        <Thead><Tr><Th>名称</Th><Th>路径</Th><Th>类型</Th><Th>权限码</Th><Th>状态</Th><Th>系统</Th><Th>操作</Th></Tr></Thead>
        <Tbody>{sorted.map((menu) => (
          <Tr key={menu.id}>
            <Td>{'　'.repeat(depthOf(menu, menus) - 1)}{menu.name}</Td>
            <Td>{menu.path}</Td>
            <Td><Badge>{menu.type}</Badge></Td>
            <Td>{menu.permissionCode || '-'}</Td>
            <Td><Badge colorScheme={menu.status === 'ENABLED' ? 'green' : 'red'}>{menu.status}</Badge></Td>
            <Td>{menu.isSystem ? '是' : '否'}</Td>
            <Td><HStack>
              <AuthButton code="system:menu:update" size="xs" onClick={() => run(async () => {
                const name = prompt('菜单名称', menu.name);
                if (name === null) return;
                const component = menu.type === 'PAGE' ? prompt('组件标识', menu.component || '') : null;
                await api(`/api/system/menus/${menu.id}`, { method: 'PATCH', body: JSON.stringify({ name, ...(component !== null ? { component: component || null } : {}) }) });
              })}>编辑</AuthButton>
              <AuthButton code="system:menu:delete" size="xs" colorScheme="red" variant="outline" onClick={() => run(async () => {
                if (!confirm(`确认删除菜单 ${menu.name}？`)) return;
                await api(`/api/system/menus/${menu.id}`, { method: 'DELETE' });
              })}>删除</AuthButton>
            </HStack></Td>
          </Tr>
        ))}</Tbody>
      </Table>
    </Box>
  );
}
