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
import { MenuFormModal } from './menu-form-modal';

type Menu = {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  component: string | null;
  icon: string | null;
  sort: number;
  type: string;
  permissionCode: string | null;
  visible: boolean;
  status: string;
  externalUrl: string | null;
  isSystem: boolean;
};
type Permission = { code: string; name: string };

function api<T = unknown>(path: string, init: RequestInit) {
  return requestJson<T>(path, init);
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

export function MenuTree({
  menus,
  permissions,
}: {
  menus: Menu[];
  permissions: Permission[];
}) {
  const { loading, run } = useActionFeedback({ refresh: true });
  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [deletingMenu, setDeletingMenu] = useState<Menu | null>(null);
  const sorted = [...menus].sort(
    (a, b) => depthOf(a, menus) - depthOf(b, menus) || a.sort - b.sort,
  );

  return (
    <>
      <DataTableCard
        minW="980px"
        title="菜单结构"
        description="维护后台导航节点、页面入口和权限码绑定，保持菜单层级清晰。"
        meta={`${menus.length} 个菜单节点 · ${permissions.length} 个可绑定权限`}
        primaryAction={
          <AuthButton
            code="system:menu:create"
            isLoading={loading}
            icon={<Icon as={Plus} boxSize={4} />}
            onClick={() => {
              setEditingMenu(null);
              formModal.onOpen();
            }}
          >
            新增菜单
          </AuthButton>
        }
      >
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>名称</Th>
              <Th>路径</Th>
              <Th>类型</Th>
              <Th>权限码</Th>
              <Th>状态</Th>
              <Th>系统</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {sorted.length > 0 ? (
            <Tbody>
              {sorted.map((menu) => (
                <Tr key={menu.id}>
                  <Td>
                    {'　'.repeat(depthOf(menu, menus) - 1)}
                    {menu.name}
                  </Td>
                  <Td>{menu.path}</Td>
                  <Td>
                    <Badge>{menu.type}</Badge>
                  </Td>
                  <Td>{menu.permissionCode || '-'}</Td>
                  <Td>
                    <Badge colorScheme={menu.status === 'ENABLED' ? 'green' : 'red'}>
                      {menu.status}
                    </Badge>
                  </Td>
                  <Td>{menu.isSystem ? '是' : '否'}</Td>
                  <Td>
                    <TableActions>
                      <AuthButton
                        code="system:menu:update"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="编辑菜单"
                        icon={<Icon as={Pencil} boxSize={4} />}
                        isDisabled={loading}
                        onClick={() => {
                          setEditingMenu(menu);
                          formModal.onOpen();
                        }}
                      />
                      <AuthButton
                        code="system:menu:delete"
                        size="xs"
                        intent="danger"
                        variant="ghost"
                        tooltip="删除菜单"
                        icon={<Icon as={Trash2} boxSize={4} />}
                        isDisabled={loading || menu.isSystem}
                        onClick={() => {
                          setDeletingMenu(menu);
                          deleteDialog.onOpen();
                        }}
                      />
                    </TableActions>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          ) : (
            <EmptyTableRow colSpan={7} text="暂无菜单数据" />
          )}
        </Table>
      </DataTableCard>

      <MenuFormModal
        isOpen={formModal.isOpen}
        isLoading={loading}
        menu={editingMenu}
        menus={menus}
        permissions={permissions}
        onClose={formModal.onClose}
        onSubmit={(payload) =>
          run(async () => {
            if (editingMenu) {
              await api(`/api/system/menus/${editingMenu.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
              });
              return;
            }
            await api('/api/system/menus', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
          })
        }
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="删除菜单"
        description={`确认删除菜单 ${deletingMenu?.name ?? ''}？子菜单和权限绑定关系请先确认。`}
        confirmLabel="删除"
        intent="danger"
        isLoading={loading}
        onClose={deleteDialog.onClose}
        onConfirm={async () => {
          const ok = await run(async () => {
            if (!deletingMenu) return;
            await api(`/api/system/menus/${deletingMenu.id}`, { method: 'DELETE' });
          });
          if (ok) deleteDialog.onClose();
        }}
      />
    </>
  );
}
