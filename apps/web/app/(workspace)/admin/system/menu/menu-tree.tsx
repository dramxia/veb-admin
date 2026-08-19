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
import type { MenuDto, MenuModuleOption } from '@veb/api-contracts';
import {
  ExternalLink,
  FileText,
  FolderTree,
  MousePointerClick,
  Pencil,
  Plus,
  SquarePlus,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AuthButton } from '@/components/auth/auth-button';
import { AppSelect } from '@/components/common/app-select';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  DataTableCard,
  EmptyTableRow,
  TableActions,
} from '@/components/common/data-table';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';
import { MenuFormModal, type MenuCreateDefaults } from './menu-form-modal';
import { buildMenuHierarchy } from './menu-hierarchy';

type MenuTypeMeta = {
  colorScheme: string;
  icon: LucideIcon;
  iconColor: string;
  label: string;
};

const MENU_TYPE_META: Record<MenuDto['type'], MenuTypeMeta> = {
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
  BUTTON: {
    colorScheme: 'orange',
    icon: MousePointerClick,
    iconColor: 'orange.600',
    label: '按钮',
  },
};

function api<T = unknown>(path: string, init: RequestInit) {
  return requestJson<T>(path, init);
}

export function MenuTree({
  menus,
  modules,
}: {
  menus: MenuDto[];
  modules: MenuModuleOption[];
}) {
  const { clearError, error, loading, run } = useActionFeedback({
    refresh: true,
  });
  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const [editingMenu, setEditingMenu] = useState<MenuDto | null>(null);
  const [createDefaults, setCreateDefaults] =
    useState<MenuCreateDefaults | null>(null);
  const [formSession, setFormSession] = useState(0);
  const [deletingMenu, setDeletingMenu] = useState<MenuDto | null>(null);
  const [moduleFilter, setModuleFilter] = useState(modules[0]?.id ?? 'ALL');
  const visibleMenus = useMemo(
    () =>
      moduleFilter === 'ALL'
        ? menus
        : menus.filter((menu) => menu.moduleId === moduleFilter),
    [menus, moduleFilter],
  );
  const rows = useMemo(() => buildMenuHierarchy(visibleMenus), [visibleMenus]);
  const buttonCount = visibleMenus.filter(
    (menu) => menu.type === 'BUTTON',
  ).length;
  const navigationCount = visibleMenus.length - buttonCount;

  function openCreate(defaults?: MenuCreateDefaults) {
    clearError();
    setEditingMenu(null);
    setCreateDefaults(defaults ?? null);
    setFormSession((current) => current + 1);
    formModal.onOpen();
  }

  return (
    <>
      <DataTableCard
        minW={{ base: '760px', lg: '1080px' }}
        title="菜单与权限结构"
        description="页面、外链和按钮节点直接承载权限码；按钮固定放在所属页面下。"
        meta={`${navigationCount} 个导航节点 · ${buttonCount} 个按钮`}
        toolbar={
          <Stack spacing={3}>
            {error ? (
              <Alert status="error" aria-live="polite">
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <AppSelect
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              sx={{ maxW: { base: 'full', md: '280px' } }}
              aria-label="按模块筛选菜单和权限"
            >
              <option value="ALL">全部模块</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </AppSelect>
          </Stack>
        }
        primaryAction={
          <AuthButton
            code="system:menu:create"
            isLoading={loading}
            icon={<Icon as={Plus} boxSize="18px" />}
            onClick={() =>
              openCreate(
                moduleFilter === 'ALL' ? undefined : { moduleId: moduleFilter },
              )
            }
          >
            新增节点
          </AuthButton>
        }
      >
        <Table size="sm" aria-label="菜单与权限层级结构">
          <Thead>
            <Tr>
              <Th>名称与层级</Th>
              <Th>路由或说明</Th>
              <Th>类型</Th>
              <Th>模块</Th>
              <Th display={{ base: 'none', lg: 'table-cell' }}>权限码</Th>
              <Th>状态</Th>
              <Th display={{ base: 'none', md: 'table-cell' }}>归属</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {rows.length > 0 ? (
            <Tbody>
              {rows.map(({ childCount, depth, menu, structure }) => {
                const typeMeta = MENU_TYPE_META[menu.type];
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
                            <Badge colorScheme="gray">
                              {menu.type === 'BUTTON'
                                ? '页面操作'
                                : `第 ${depth + 1} 层`}
                            </Badge>
                            {menu.type !== 'BUTTON' && !menu.visible ? (
                              <Badge colorScheme="gray">导航隐藏</Badge>
                            ) : null}
                          </HStack>
                        </Stack>
                        <VisuallyHidden>
                          {menu.name}，{typeMeta.label}，
                          {childCount > 0
                            ? `${childCount} 个直接子项`
                            : '无子项'}
                        </VisuallyHidden>
                      </Flex>
                    </Td>
                    <Td>
                      <Stack spacing={1} minW="190px">
                        <Text color="ink.700" fontWeight="700">
                          {menu.type === 'LINK'
                            ? menu.externalUrl || '-'
                            : menu.type === 'BUTTON'
                              ? menu.description || '页面操作权限'
                              : menu.path || '-'}
                        </Text>
                        {menu.type === 'PAGE' && menu.component ? (
                          <Text color="ink.500" fontSize="xs">
                            组件：{menu.component}
                          </Text>
                        ) : null}
                        {menu.type !== 'BUTTON' && menu.description ? (
                          <Text color="ink.500" fontSize="xs" noOfLines={1}>
                            {menu.description}
                          </Text>
                        ) : null}
                        {menu.type === 'BUTTON' && menu.permissionCode ? (
                          <Text
                            display={{ base: 'block', lg: 'none' }}
                            color="ink.500"
                            fontSize="xs"
                            wordBreak="break-all"
                          >
                            {menu.permissionCode}
                          </Text>
                        ) : null}
                      </Stack>
                    </Td>
                    <Td>
                      <Badge colorScheme={typeMeta.colorScheme}>
                        {typeMeta.label}
                      </Badge>
                    </Td>
                    <Td>
                      {modules.find((module) => module.id === menu.moduleId)
                        ?.name ?? '-'}
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
                        {menu.type !== 'BUTTON' ? (
                          <Badge colorScheme={menu.visible ? 'cyan' : 'gray'}>
                            {menu.visible ? '导航显示' : '导航隐藏'}
                          </Badge>
                        ) : (
                          <Badge colorScheme="gray">排序 {menu.sort}</Badge>
                        )}
                      </Stack>
                    </Td>
                    <Td display={{ base: 'none', md: 'table-cell' }}>
                      <Badge colorScheme={menu.isSystem ? 'purple' : 'gray'}>
                        {menu.isSystem ? '系统内置' : '自定义'}
                      </Badge>
                    </Td>
                    <Td>
                      <TableActions>
                        {menu.type === 'PAGE' ? (
                          <AuthButton
                            code="system:menu:create"
                            size="xs"
                            intent="neutral"
                            variant="ghost"
                            tooltip="新增按钮"
                            aria-label={`在页面 ${menu.name} 下新增按钮`}
                            icon={<Icon as={SquarePlus} boxSize="18px" />}
                            isDisabled={loading}
                            onClick={() =>
                              openCreate({
                                moduleId: menu.moduleId,
                                parentId: menu.id,
                                type: 'BUTTON',
                                lockParent: true,
                              })
                            }
                          />
                        ) : null}
                        <AuthButton
                          code="system:menu:update"
                          size="xs"
                          intent="neutral"
                          variant="ghost"
                          tooltip={`编辑${typeMeta.label}`}
                          aria-label={`编辑${typeMeta.label} ${menu.name}`}
                          icon={<Icon as={Pencil} boxSize="18px" />}
                          isDisabled={loading}
                          onClick={() => {
                            clearError();
                            setCreateDefaults(null);
                            setEditingMenu(menu);
                            setFormSession((current) => current + 1);
                            formModal.onOpen();
                          }}
                        />
                        <AuthButton
                          code="system:menu:delete"
                          size="xs"
                          intent="danger"
                          variant="ghost"
                          tooltip={
                            menu.isSystem
                              ? `系统${typeMeta.label}不可删除`
                              : `删除${typeMeta.label}`
                          }
                          aria-label={`删除${typeMeta.label} ${menu.name}`}
                          icon={<Icon as={Trash2} boxSize="18px" />}
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
            <EmptyTableRow colSpan={8} text="暂无菜单或按钮数据" />
          )}
        </Table>
      </DataTableCard>

      <MenuFormModal
        isOpen={formModal.isOpen}
        isLoading={loading}
        error={error}
        menu={editingMenu}
        menus={menus}
        modules={modules}
        createDefaults={createDefaults}
        formSession={formSession}
        onClose={() => {
          clearError();
          formModal.onClose();
        }}
        onSubmit={(payload) =>
          run(async () => {
            if (editingMenu) {
              await api(`/api/v1/system/menus/${editingMenu.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
              });
              return;
            }
            await api('/api/v1/system/menus', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
          })
        }
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={`删除${deletingMenu ? MENU_TYPE_META[deletingMenu.type].label : '节点'}`}
        description={`确认删除 ${deletingMenu?.name ?? ''}？有子节点时后端会拒绝删除，已有角色授权会随叶子节点一并撤销。`}
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
            await api(`/api/v1/system/menus/${deletingMenu.id}`, {
              method: 'DELETE',
            });
          });
          if (ok) deleteDialog.onClose();
        }}
      />
    </>
  );
}
