'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Grid,
  HStack,
  Icon,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import type {
  RoleAccessDetailDto,
  RoleAccessMenuOption,
  RoleAccessModuleOption,
  RoleDto,
} from '@veb/api-contracts';
import {
  ExternalLink,
  FileText,
  FolderTree,
  MousePointerClick,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  getErrorMessage,
  useActionFeedback,
} from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';
import { buildMenuHierarchy } from '../menu/menu-hierarchy';
import { useRoleAssignmentDetail } from './use-role-assignment-detail';

type AssignAccessDrawerProps = {
  isOpen: boolean;
  role: RoleDto | null;
  onClose: () => void;
};

const EMPTY_MENUS: RoleAccessMenuOption[] = [];
const EMPTY_MODULES: RoleAccessModuleOption[] = [];

const NODE_ICON = {
  BUTTON: MousePointerClick,
  DIR: FolderTree,
  LINK: ExternalLink,
  PAGE: FileText,
} as const;

function getAccessDetailPath(roleId: string) {
  return `/api/v1/system/roles/${roleId}/access`;
}

function getSelectedMenuIds(detail: RoleAccessDetailDto) {
  return detail.assignments.flatMap((item) => item.menuIds);
}

function areAncestorsEnabled(
  menu: RoleAccessMenuOption,
  menusById: Map<string, RoleAccessMenuOption>,
) {
  const visited = new Set<string>([menu.id]);
  let parentId = menu.parentId;

  while (parentId) {
    if (visited.has(parentId)) return false;
    visited.add(parentId);
    const parent = menusById.get(parentId);
    if (!parent || parent.status !== 'ENABLED') return false;
    parentId = parent.parentId;
  }

  return true;
}

function areAncestorsVisible(
  menu: RoleAccessMenuOption,
  menusById: Map<string, RoleAccessMenuOption>,
) {
  const visited = new Set<string>([menu.id]);
  let parentId = menu.parentId;

  while (parentId) {
    if (visited.has(parentId)) return false;
    visited.add(parentId);
    const parent = menusById.get(parentId);
    if (!parent || !parent.visible) return false;
    parentId = parent.parentId;
  }

  return true;
}

function getDescendants(menus: RoleAccessMenuOption[], parentId: string) {
  const result: RoleAccessMenuOption[] = [];
  const pending = [parentId];
  const visited = new Set<string>();

  while (pending.length > 0) {
    const currentId = pending.pop();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    for (const menu of menus) {
      if (menu.parentId !== currentId) continue;
      result.push(menu);
      pending.push(menu.id);
    }
  }

  return result;
}

export function AssignAccessDrawer({
  isOpen,
  role,
  onClose,
}: AssignAccessDrawerProps) {
  const { loading, run } = useActionFeedback({ refresh: true });
  const removalDialog = useDisclosure();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [pendingRemoval, setPendingRemoval] =
    useState<RoleAccessModuleOption | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const activeRoleIdRef = useRef(role?.id ?? null);
  activeRoleIdRef.current = role?.id ?? null;

  const detail = useRoleAssignmentDetail<RoleAccessDetailDto>({
    errorFallback: '角色访问范围加载失败',
    getPath: getAccessDetailPath,
    getSelectedIds: getSelectedMenuIds,
    isOpen,
    roleId: role?.id ?? null,
  });
  const locked = role?.code === 'superadmin';
  const detailData = detail.data;
  const menus = detailData?.menus ?? EMPTY_MENUS;
  const modules = detailData?.modules ?? EMPTY_MODULES;
  const setDetailSelectedIds = detail.setSelectedIds;
  const menusById = useMemo(
    () => new Map(menus.map((menu) => [menu.id, menu] as const)),
    [menus],
  );
  const effectiveMenuIds = useMemo(
    () =>
      new Set(
        menus
          .filter(
            (menu) =>
              menu.status === 'ENABLED' && areAncestorsEnabled(menu, menusById),
          )
          .map((menu) => menu.id),
      ),
    [menus, menusById],
  );

  useEffect(() => {
    setSubmitError(null);
    setPendingRemoval(null);
  }, [isOpen, role?.id]);

  useEffect(() => {
    if (!detailData) return;

    if (locked) {
      const enabledModuleIds = modules
        .filter((module) => module.status === 'ENABLED')
        .map((module) => module.id);
      setSelectedModuleIds(enabledModuleIds);
      setDetailSelectedIds(
        menus
          .filter(
            (menu) =>
              enabledModuleIds.includes(menu.moduleId) &&
              menu.type !== 'DIR' &&
              effectiveMenuIds.has(menu.id),
          )
          .map((menu) => menu.id),
      );
      setActiveModuleId(enabledModuleIds[0] ?? null);
      return;
    }

    const assignedModuleIds = [
      ...new Set(detailData.assignments.map((item) => item.moduleId)),
    ];
    const normalizedMenuIds = new Set<string>();
    for (const assignment of detailData.assignments) {
      for (const menuId of assignment.menuIds) {
        const menu = menusById.get(menuId);
        if (
          !menu ||
          menu.moduleId !== assignment.moduleId ||
          menu.type === 'DIR'
        ) {
          continue;
        }
        normalizedMenuIds.add(menu.id);
        if (menu.type === 'BUTTON' && menu.parentId) {
          const parent = menusById.get(menu.parentId);
          if (parent?.type === 'PAGE') normalizedMenuIds.add(parent.id);
        }
      }
    }

    setSelectedModuleIds(assignedModuleIds);
    setDetailSelectedIds([...normalizedMenuIds]);
    setActiveModuleId(
      assignedModuleIds[0] ??
        modules.find((module) => module.status === 'ENABLED')?.id ??
        null,
    );
  }, [
    detailData,
    effectiveMenuIds,
    locked,
    menus,
    menusById,
    modules,
    setDetailSelectedIds,
  ]);

  const selectedModuleIdSet = useMemo(
    () => new Set(selectedModuleIds),
    [selectedModuleIds],
  );
  const selectedMenuIdSet = useMemo(
    () => new Set(detail.selectedIds),
    [detail.selectedIds],
  );
  const persistedModuleIdSet = useMemo(
    () => new Set(detail.data?.assignments.map((item) => item.moduleId) ?? []),
    [detail.data],
  );
  const activeModule = modules.find((module) => module.id === activeModuleId);
  const activeMenus = useMemo(
    () => menus.filter((menu) => menu.moduleId === activeModuleId),
    [activeModuleId, menus],
  );
  const activeRows = useMemo(
    () => buildMenuHierarchy(activeMenus),
    [activeMenus],
  );
  const canEdit = detail.isReady && !locked && !loading;
  const detailLoading = detail.status === 'loading';

  function hasLandingPage(moduleId: string) {
    if (
      modules.find((module) => module.id === moduleId)?.status !== 'ENABLED'
    ) {
      return false;
    }
    return menus.some(
      (menu) =>
        menu.moduleId === moduleId &&
        menu.type === 'PAGE' &&
        menu.visible === true &&
        effectiveMenuIds.has(menu.id) &&
        areAncestorsVisible(menu, menusById) &&
        selectedMenuIdSet.has(menu.id),
    );
  }

  function removeModule(moduleId: string) {
    const menuIds = new Set(
      menus.filter((menu) => menu.moduleId === moduleId).map((menu) => menu.id),
    );
    setSelectedModuleIds((current) =>
      current.filter((currentId) => currentId !== moduleId),
    );
    detail.setSelectedIds(
      detail.selectedIds.filter((menuId) => !menuIds.has(menuId)),
    );
    setSubmitError(null);
  }

  function toggleModule(module: RoleAccessModuleOption, checked: boolean) {
    if (!canEdit) return;
    if (checked) {
      if (module.status !== 'ENABLED') return;
      setSelectedModuleIds((current) =>
        current.includes(module.id) ? current : [...current, module.id],
      );
      setActiveModuleId(module.id);
      setSubmitError(null);
      return;
    }

    if (persistedModuleIdSet.has(module.id)) {
      setPendingRemoval(module);
      removalDialog.onOpen();
      return;
    }
    removeModule(module.id);
  }

  function toggleNode(menu: RoleAccessMenuOption, checked: boolean) {
    if (!canEdit || !selectedModuleIdSet.has(menu.moduleId)) return;
    const next = new Set(detail.selectedIds);

    if (menu.type === 'DIR') {
      const descendants = getDescendants(activeMenus, menu.id);
      const navigationNodes = descendants.filter(
        (item) => item.type === 'PAGE' || item.type === 'LINK',
      );
      if (checked) {
        navigationNodes
          .filter((item) => effectiveMenuIds.has(item.id))
          .forEach((item) => next.add(item.id));
      } else {
        const removedPageIds = new Set(
          navigationNodes
            .filter((item) => item.type === 'PAGE')
            .map((item) => item.id),
        );
        navigationNodes.forEach((item) => next.delete(item.id));
        activeMenus
          .filter(
            (item) =>
              item.type === 'BUTTON' &&
              item.parentId &&
              removedPageIds.has(item.parentId),
          )
          .forEach((item) => next.delete(item.id));
      }
    } else if (menu.type === 'BUTTON') {
      if (checked) {
        next.add(menu.id);
        if (menu.parentId) next.add(menu.parentId);
      } else {
        next.delete(menu.id);
      }
    } else if (menu.type === 'PAGE') {
      if (checked) {
        next.add(menu.id);
        activeMenus
          .filter(
            (item) =>
              item.type === 'BUTTON' &&
              item.parentId === menu.id &&
              effectiveMenuIds.has(item.id),
          )
          .forEach((item) => next.add(item.id));
      } else {
        next.delete(menu.id);
        activeMenus
          .filter((item) => item.type === 'BUTTON' && item.parentId === menu.id)
          .forEach((item) => next.delete(item.id));
      }
    } else if (checked) {
      next.add(menu.id);
    } else {
      next.delete(menu.id);
    }

    setSubmitError(null);
    detail.setSelectedIds([...next]);
  }

  function getDirectoryState(menu: RoleAccessMenuOption) {
    const descendants = getDescendants(activeMenus, menu.id);
    const grantableIds = descendants
      .filter(
        (item) =>
          (item.type === 'PAGE' || item.type === 'LINK') &&
          effectiveMenuIds.has(item.id),
      )
      .map((item) => item.id);
    const selectedGrantableCount = grantableIds.filter((id) =>
      selectedMenuIdSet.has(id),
    ).length;
    const anySelected = descendants.some((item) =>
      selectedMenuIdSet.has(item.id),
    );

    return {
      checked:
        grantableIds.length > 0 &&
        selectedGrantableCount === grantableIds.length,
      disabled: grantableIds.length === 0,
      indeterminate:
        anySelected &&
        (selectedGrantableCount < grantableIds.length ||
          grantableIds.length === 0),
    };
  }

  async function handleSubmit() {
    const roleId = role?.id;
    if (!roleId || !detail.isReady || locked || loading) return;

    const invalidModules = modules.filter(
      (module) =>
        selectedModuleIdSet.has(module.id) && !hasLandingPage(module.id),
    );
    if (invalidModules.length > 0) {
      setSubmitError(
        `${invalidModules.map((module) => module.name).join('、')} 缺少已授权、启用且在导航中显示的页面。`,
      );
      return;
    }

    const payload = {
      modules: modules
        .filter((module) => selectedModuleIdSet.has(module.id))
        .map((module) => ({
          moduleId: module.id,
          menuIds: menus
            .filter(
              (menu) =>
                menu.moduleId === module.id &&
                menu.type !== 'DIR' &&
                selectedMenuIdSet.has(menu.id),
            )
            .map((menu) => menu.id),
        })),
    };

    setSubmitError(null);
    const ok = await run(
      async () => {
        try {
          await requestJson(`/api/v1/system/roles/${roleId}/access`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
        } catch (error) {
          setSubmitError(getErrorMessage(error, '访问权限保存失败'));
          throw error;
        }
      },
      {
        errorTitle: '访问权限保存失败',
        successTitle: '角色访问权限已更新',
      },
    );

    if (ok && activeRoleIdRef.current === roleId) onClose();
  }

  function handleClose() {
    if (!loading) onClose();
  }

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={handleClose}
        placement="right"
        size="full"
        closeOnEsc={!loading}
        closeOnOverlayClick={!loading}
      >
        <DrawerOverlay />
        <DrawerContent maxW={{ base: '100%', xl: '1080px' }} ms="auto">
          <DrawerCloseButton
            aria-label="关闭访问权限抽屉"
            isDisabled={loading}
          />
          <DrawerHeader>
            <Stack spacing={2} pr={8}>
              <Text>{locked ? '查看访问权限' : '配置访问权限'}</Text>
              <HStack spacing={2} wrap="wrap">
                <Badge colorScheme="brand">{role?.name ?? '未选择角色'}</Badge>
                {detail.isReady ? (
                  <Badge colorScheme="gray">
                    {selectedModuleIds.length} 个模块 ·{' '}
                    {detail.selectedIds.length} 个节点
                  </Badge>
                ) : null}
                {locked ? <Badge colorScheme="red">系统锁定</Badge> : null}
              </HStack>
            </Stack>
          </DrawerHeader>
          <DrawerBody p={0} overflow="hidden">
            {locked && detail.isReady ? (
              <Alert status="info" rounded="none">
                <AlertIcon />
                <AlertDescription>
                  超级管理员隐式拥有全部启用模块和有效节点，此处仅供查看。
                </AlertDescription>
              </Alert>
            ) : null}
            {submitError ? (
              <Alert status="error" rounded="none">
                <AlertIcon />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            {detailLoading ? (
              <Grid
                templateColumns={{ base: '1fr', lg: '300px minmax(0, 1fr)' }}
                gap={5}
                p={5}
                role="status"
                aria-label="正在加载角色访问权限"
              >
                <Stack spacing={3}>
                  <Skeleton h="64px" />
                  <Skeleton h="64px" />
                  <Skeleton h="64px" />
                </Stack>
                <Stack spacing={3}>
                  <Skeleton h="48px" />
                  <Skeleton h="72px" />
                  <Skeleton h="72px" />
                </Stack>
              </Grid>
            ) : null}

            {detail.status === 'error' ? (
              <Alert
                status="error"
                m={5}
                alignItems="flex-start"
                flexDirection="column"
                gap={3}
              >
                <HStack align="flex-start" spacing={2}>
                  <AlertIcon mt={1} />
                  <Box>
                    <AlertTitle>访问范围加载失败</AlertTitle>
                    <AlertDescription>
                      {detail.error ?? '请稍后重试。'}
                    </AlertDescription>
                  </Box>
                </HStack>
                <Button size="sm" variant="outline" onClick={detail.retry}>
                  重新加载
                </Button>
              </Alert>
            ) : null}

            {detail.isReady ? (
              <Grid
                templateColumns={{ base: '1fr', lg: '300px minmax(0, 1fr)' }}
                h="100%"
                minH={0}
              >
                <Stack
                  spacing={0}
                  borderRightWidth={{ base: 0, lg: '1px' }}
                  borderBottomWidth={{ base: '1px', lg: 0 }}
                  borderColor="ink.100"
                  overflowY="auto"
                  maxH={{ base: '280px', lg: 'none' }}
                >
                  <Box
                    px={5}
                    py={4}
                    borderBottomWidth="1px"
                    borderColor="ink.100"
                  >
                    <Text color="ink.800" fontWeight="900">
                      模块
                    </Text>
                    <Text color="ink.500" fontSize="sm" mt={1}>
                      勾选模块后配置其页面和操作。
                    </Text>
                  </Box>
                  {modules.map((module) => {
                    const checked = selectedModuleIdSet.has(module.id);
                    const missingLanding =
                      checked && !hasLandingPage(module.id);
                    return (
                      <Grid
                        key={module.id}
                        templateColumns="auto minmax(0, 1fr)"
                        gap={2}
                        alignItems="center"
                        px={4}
                        py={3}
                        bg={
                          activeModuleId === module.id ? 'brand.50' : undefined
                        }
                        borderBottomWidth="1px"
                        borderColor="ink.100"
                      >
                        <Checkbox
                          isChecked={checked}
                          isDisabled={
                            !canEdit ||
                            (module.status !== 'ENABLED' && !checked)
                          }
                          onChange={(event) =>
                            toggleModule(module, event.target.checked)
                          }
                          aria-label={`${checked ? '取消' : '选择'}模块 ${module.name}`}
                        />
                        <Button
                          variant="ghost"
                          justifyContent="flex-start"
                          h="auto"
                          minW={0}
                          px={2}
                          py={1}
                          whiteSpace="normal"
                          textAlign="left"
                          onClick={() => setActiveModuleId(module.id)}
                        >
                          <Stack spacing={1} align="flex-start" minW={0}>
                            <HStack spacing={2} wrap="wrap">
                              <Text color="ink.800" fontWeight="800">
                                {module.name}
                              </Text>
                              {module.status !== 'ENABLED' ? (
                                <Badge colorScheme="red">已停用</Badge>
                              ) : null}
                            </HStack>
                            {missingLanding ? (
                              <Badge colorScheme="orange">缺少可用入口</Badge>
                            ) : (
                              <Text color="ink.500" fontSize="xs">
                                {module._count.menus} 个菜单 ·{' '}
                                {module._count.buttons} 个按钮
                              </Text>
                            )}
                          </Stack>
                        </Button>
                      </Grid>
                    );
                  })}
                </Stack>

                <Stack spacing={0} minW={0} overflowY="auto">
                  {activeModule ? (
                    <>
                      <Box
                        px={5}
                        py={4}
                        borderBottomWidth="1px"
                        borderColor="ink.100"
                      >
                        <HStack
                          justify="space-between"
                          align="flex-start"
                          spacing={4}
                        >
                          <Box minW={0}>
                            <Text color="ink.800" fontWeight="900">
                              {activeModule.name}
                            </Text>
                            <Text color="ink.500" fontSize="sm" mt={1}>
                              目录勾选只批量选择页面和外链，按钮需逐项授权。
                            </Text>
                          </Box>
                          <Badge
                            colorScheme={
                              selectedModuleIdSet.has(activeModule.id)
                                ? 'green'
                                : 'gray'
                            }
                            flexShrink={0}
                          >
                            {selectedModuleIdSet.has(activeModule.id)
                              ? '已选择模块'
                              : '未选择模块'}
                          </Badge>
                        </HStack>
                      </Box>

                      {!selectedModuleIdSet.has(activeModule.id) ? (
                        <Alert status="warning" m={5}>
                          <AlertIcon />
                          <AlertDescription>
                            请先在左侧勾选该模块，再配置菜单和按钮权限。
                          </AlertDescription>
                        </Alert>
                      ) : null}

                      {activeRows.length > 0 ? (
                        <Stack spacing={0} pb={5}>
                          {activeRows.map(({ depth, menu }) => {
                            const directoryState =
                              menu.type === 'DIR'
                                ? getDirectoryState(menu)
                                : null;
                            const checked =
                              directoryState?.checked ??
                              selectedMenuIdSet.has(menu.id);
                            const effective = effectiveMenuIds.has(menu.id);
                            const disabled =
                              !canEdit ||
                              !selectedModuleIdSet.has(menu.moduleId) ||
                              (menu.type === 'DIR'
                                ? directoryState?.disabled &&
                                  !directoryState.indeterminate
                                : !effective && !checked);
                            const NodeIcon = NODE_ICON[menu.type];

                            return (
                              <Grid
                                key={menu.id}
                                templateColumns="auto minmax(0, 1fr)"
                                gap={3}
                                alignItems="flex-start"
                                ps={`${20 + Math.min(depth, 8) * 20}px`}
                                pe={5}
                                py={3}
                                borderBottomWidth="1px"
                                borderColor="ink.100"
                                bg={
                                  menu.type === 'BUTTON'
                                    ? 'orange.50'
                                    : undefined
                                }
                              >
                                <Checkbox
                                  mt={1}
                                  isChecked={checked}
                                  isIndeterminate={
                                    directoryState?.indeterminate
                                  }
                                  isDisabled={disabled}
                                  onChange={(event) =>
                                    toggleNode(menu, event.target.checked)
                                  }
                                  aria-label={`${checked ? '取消' : '选择'}${menu.name}`}
                                />
                                <Stack spacing={1} minW={0}>
                                  <HStack spacing={2} wrap="wrap">
                                    <Icon
                                      as={NodeIcon}
                                      boxSize={4}
                                      color={
                                        menu.type === 'BUTTON'
                                          ? 'orange.600'
                                          : 'ink.500'
                                      }
                                    />
                                    <Text color="ink.800" fontWeight="800">
                                      {menu.name}
                                    </Text>
                                    <Badge
                                      colorScheme={
                                        menu.type === 'BUTTON'
                                          ? 'orange'
                                          : 'gray'
                                      }
                                    >
                                      {menu.type === 'DIR'
                                        ? '目录'
                                        : menu.type === 'PAGE'
                                          ? '页面'
                                          : menu.type === 'LINK'
                                            ? '外链'
                                            : '按钮'}
                                    </Badge>
                                    {!effective ? (
                                      <Badge colorScheme="red">当前无效</Badge>
                                    ) : null}
                                    {menu.type === 'PAGE' && !menu.visible ? (
                                      <Badge colorScheme="gray">导航隐藏</Badge>
                                    ) : null}
                                  </HStack>
                                  <Text
                                    color="ink.500"
                                    fontSize="xs"
                                    wordBreak="break-all"
                                  >
                                    {menu.type === 'DIR'
                                      ? '全选本组菜单（不含按钮）'
                                      : menu.permissionCode ||
                                        menu.path ||
                                        menu.externalUrl ||
                                        '无权限码'}
                                  </Text>
                                </Stack>
                              </Grid>
                            );
                          })}
                        </Stack>
                      ) : (
                        <Box p={8} textAlign="center">
                          <Text color="ink.500">该模块还没有菜单或按钮</Text>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box p={8} textAlign="center">
                      <Text color="ink.500">暂无可配置模块</Text>
                    </Box>
                  )}
                </Stack>
              </Grid>
            ) : null}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" onClick={handleClose} isDisabled={loading}>
              {locked ? '关闭' : '取消'}
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={loading || detailLoading}
              loadingText={detailLoading ? '加载详情' : '保存中'}
              isDisabled={!canEdit}
            >
              保存
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        isOpen={removalDialog.isOpen}
        title="取消模块授权"
        description={`取消 ${pendingRemoval?.name ?? ''} 后，该模块下已勾选的菜单和按钮权限会从本次草稿中清空。`}
        confirmLabel="取消授权"
        intent="danger"
        onClose={() => {
          setPendingRemoval(null);
          removalDialog.onClose();
        }}
        onConfirm={() => {
          if (pendingRemoval) removeModule(pendingRemoval.id);
          setPendingRemoval(null);
          removalDialog.onClose();
        }}
      />
    </>
  );
}
