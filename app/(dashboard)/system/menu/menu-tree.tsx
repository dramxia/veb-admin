'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VisuallyHidden,
  useDisclosure,
} from '@chakra-ui/react';
import {
  ExternalLink,
  FileText,
  FolderTree,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
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
import { MenuFormModal } from './menu-form-modal';
import { buildMenuHierarchy } from './menu-hierarchy';

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

type MenuTypeMeta = {
  colorScheme: string;
  icon: LucideIcon;
  iconColor: string;
  label: string;
};

const MENU_TYPE_META: Record<string, MenuTypeMeta> = {
  DIR: {
    colorScheme: 'gray',
    icon: FolderTree,
    iconColor: 'ink.500',
    label: '目录',
  },
  LINK: {
    colorScheme: 'cyan',
    icon: ExternalLink,
    iconColor: 'cyan.600',
    label: '外链',
  },
  PAGE: {
    colorScheme: 'brand',
    icon: FileText,
    iconColor: 'brand.600',
    label: '页面',
  },
};

const DEFAULT_TYPE_META: MenuTypeMeta = {
  colorScheme: 'gray',
  icon: FileText,
  iconColor: 'ink.500',
  label: '未知',
};

function api<T = unknown>(path: string, init: RequestInit) {
  return requestJson<T>(path, init);
}

export function MenuTree({
  menus,
  permissions,
}: {
  menus: Menu[];
  permissions: Permission[];
}) {
  const { clearError, error, loading, run } = useActionFeedback({
    refresh: true,
  });
  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [deletingMenu, setDeletingMenu] = useState<Menu | null>(null);
  const rows = useMemo(() => buildMenuHierarchy(menus), [menus]);

  return (
    <>
      <DataTableCard
        minW={{ base: '700px', lg: '980px' }}
        title="菜单结构"
        description="父节点后紧跟完整子树；层级、导航可见性和启停状态可直接扫描。"
        meta={`${menus.length} 个菜单节点 · ${permissions.length} 个可绑定权限`}
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
            code="system:menu:create"
            isLoading={loading}
            icon={<Icon as={Plus} boxSize={4.5} />}
            onClick={() => {
              clearError();
              setEditingMenu(null);
              formModal.onOpen();
            }}
          >
            新增菜单
          </AuthButton>
        }
      >
        <Table size="sm" aria-label="菜单层级结构">
          <Thead>
            <Tr>
              <Th>名称与层级</Th>
              <Th>路径</Th>
              <Th>类型</Th>
              <Th display={{ base: 'none', lg: 'table-cell' }}>权限码</Th>
              <Th>状态</Th>
              <Th display={{ base: 'none', md: 'table-cell' }}>归属</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {rows.length > 0 ? (
            <Tbody>
              {rows.map(({ childCount, depth, menu, structure }) => {
                const typeMeta = MENU_TYPE_META[menu.type] ?? DEFAULT_TYPE_META;
                const indentation = Math.min(depth, 10) * 4;

                return (
                  <Tr key={menu.id}>
                    <Td>
                      <Flex
                        align="center"
                        gap={2.5}
                        minW="260px"
                        ps={indentation}
                      >
                        {depth > 0 ? (
                          <Box
                            aria-hidden="true"
                            w={3}
                            h={5}
                            flexShrink={0}
                            borderLeftWidth="1px"
                            borderBottomWidth="1px"
                            borderColor="ink.200"
                          />
                        ) : null}
                        <Icon
                          as={typeMeta.icon}
                          boxSize={5}
                          color={typeMeta.iconColor}
                          flexShrink={0}
                        />
                        <Stack spacing={1} minW={0}>
                          <HStack spacing={2} wrap="wrap">
                            <Text color="ink.800" fontWeight="800">
                              {menu.name}
                            </Text>
                            {childCount > 0 ? (
                              <Badge colorScheme="gray">
                                {childCount} 个子项
                              </Badge>
                            ) : null}
                            {structure !== 'normal' ? (
                              <Badge colorScheme="red">结构异常</Badge>
                            ) : null}
                          </HStack>
                          <HStack spacing={2} wrap="wrap">
                            <Badge colorScheme="gray">第 {depth + 1} 层</Badge>
                            {!menu.visible ? (
                              <Badge colorScheme="gray">导航隐藏</Badge>
                            ) : null}
                          </HStack>
                        </Stack>
                        <VisuallyHidden>
                          {menu.name}，第 {depth + 1} 层，
                          {childCount > 0
                            ? `${childCount} 个直接子菜单`
                            : '无子菜单'}
                        </VisuallyHidden>
                      </Flex>
                    </Td>
                    <Td>
                      <Stack spacing={1} minW="180px">
                        <Text color="ink.700" fontWeight="700">
                          {menu.path || '-'}
                        </Text>
                        {menu.type === 'PAGE' && menu.component ? (
                          <Text color="ink.500" fontSize="xs">
                            组件：{menu.component}
                          </Text>
                        ) : null}
                        {menu.type === 'LINK' && menu.externalUrl ? (
                          <Text color="ink.500" fontSize="xs" noOfLines={1}>
                            外链：{menu.externalUrl}
                          </Text>
                        ) : null}
                      </Stack>
                    </Td>
                    <Td>
                      <Badge colorScheme={typeMeta.colorScheme}>
                        {typeMeta.label}
                      </Badge>
                    </Td>
                    <Td display={{ base: 'none', lg: 'table-cell' }}>
                      <Text color="ink.600" fontSize="xs" wordBreak="break-all">
                        {menu.permissionCode || '-'}
                      </Text>
                    </Td>
                    <Td>
                      <Stack align="flex-start" spacing={1.5}>
                        <Badge
                          colorScheme={
                            menu.status === 'ENABLED' ? 'green' : 'red'
                          }
                        >
                          {menu.status === 'ENABLED' ? '启用' : '停用'}
                        </Badge>
                        <Badge colorScheme={menu.visible ? 'cyan' : 'gray'}>
                          {menu.visible ? '导航显示' : '导航隐藏'}
                        </Badge>
                      </Stack>
                    </Td>
                    <Td display={{ base: 'none', md: 'table-cell' }}>
                      <Badge colorScheme={menu.isSystem ? 'purple' : 'gray'}>
                        {menu.isSystem ? '系统内置' : '自定义'}
                      </Badge>
                    </Td>
                    <Td>
                      <TableActions>
                        <AuthButton
                          code="system:menu:update"
                          size="xs"
                          intent="neutral"
                          variant="ghost"
                          tooltip="编辑菜单"
                          aria-label={`编辑菜单 ${menu.name}`}
                          icon={<Icon as={Pencil} boxSize={4.5} />}
                          isDisabled={loading}
                          onClick={() => {
                            clearError();
                            setEditingMenu(menu);
                            formModal.onOpen();
                          }}
                        />
                        <AuthButton
                          code="system:menu:delete"
                          size="xs"
                          intent="danger"
                          variant="ghost"
                          tooltip={
                            menu.isSystem ? '系统菜单不可删除' : '删除菜单'
                          }
                          aria-label={`删除菜单 ${menu.name}`}
                          icon={<Icon as={Trash2} boxSize={4.5} />}
                          isDisabled={loading || menu.isSystem}
                          onClick={() => {
                            clearError();
                            setDeletingMenu(menu);
                            deleteDialog.onOpen();
                          }}
                        />
                      </TableActions>
                    </Td>
                  </Tr>
                );
              })}
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
        onClose={() => {
          clearError();
          formModal.onClose();
        }}
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
            if (!deletingMenu) return;
            await api(`/api/system/menus/${deletingMenu.id}`, {
              method: 'DELETE',
            });
          });
          if (ok) deleteDialog.onClose();
        }}
      />
    </>
  );
}
