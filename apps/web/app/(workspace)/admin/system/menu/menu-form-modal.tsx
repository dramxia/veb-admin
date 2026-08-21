'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import type { MenuDto, MenuModuleOption } from '@veb/api-contracts';
import { useEffect, useMemo, useState } from 'react';
import { AlertStatusIcon } from '@/components/common/alert-status-icon';
import { AppSelect } from '@/components/common/app-select';
import { OverlayCloseButton } from '@/components/common/overlay-close-button';
import {
  buildMenuHierarchy,
  collectDescendantIds,
  type MenuHierarchyRow,
} from './menu-hierarchy';

export type MenuPayload = {
  moduleId?: string;
  parentId?: string | null;
  name: string;
  description?: string | null;
  path?: string | null;
  component?: string | null;
  icon?: string | null;
  sort?: number;
  type: MenuDto['type'];
  permissionCode?: string | null;
  visible?: boolean;
  status?: MenuDto['status'];
  externalUrl?: string | null;
};

export type MenuCreateDefaults = {
  moduleId?: string;
  parentId?: string;
  type?: MenuDto['type'];
  lockParent?: boolean;
};

type MenuFormModalProps = {
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  menu?: MenuDto | null;
  menus: MenuDto[];
  modules: MenuModuleOption[];
  createDefaults?: MenuCreateDefaults | null;
  formSession: number;
  onClose: () => void;
  onSubmit: (payload: MenuPayload) => Promise<boolean> | boolean;
};

function getParentOptionLabel(row: MenuHierarchyRow<MenuDto>) {
  const prefix = row.depth > 0 ? `${'　'.repeat(row.depth - 1)}└─ ` : '';
  return `${prefix}${row.menu.name}`;
}

function isAllowedParent(type: MenuDto['type'], parent: MenuDto) {
  return type === 'BUTTON' ? parent.type === 'PAGE' : parent.type === 'DIR';
}

export function MenuFormModal({
  isOpen,
  isLoading,
  error,
  menu,
  menus,
  modules,
  createDefaults,
  formSession,
  onClose,
  onSubmit,
}: MenuFormModalProps) {
  const editing = Boolean(menu);
  const locked = Boolean(menu?.isSystem);
  const busy = Boolean(isLoading);
  const presetButton = Boolean(
    !menu &&
    createDefaults?.lockParent &&
    createDefaults.type === 'BUTTON' &&
    createDefaults.parentId,
  );
  const [type, setType] = useState<MenuDto['type']>(
    menu?.type ?? createDefaults?.type ?? 'PAGE',
  );
  const [visible, setVisible] = useState(menu?.visible ?? true);
  const [parentId, setParentId] = useState(
    menu?.parentId ?? createDefaults?.parentId ?? '',
  );
  const [moduleId, setModuleId] = useState(
    menu?.moduleId ?? createDefaults?.moduleId ?? '',
  );
  const [parentError, setParentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const moduleMenus = useMemo(
    () => menus.filter((item) => item.moduleId === moduleId),
    [menus, moduleId],
  );
  const hierarchy = useMemo(
    () => buildMenuHierarchy(moduleMenus),
    [moduleMenus],
  );
  const forbiddenParentIds = useMemo(() => {
    if (!menu) return new Set<string>();
    return new Set([menu.id, ...collectDescendantIds(moduleMenus, menu.id)]);
  }, [menu, moduleMenus]);
  const parentOptions = useMemo(
    () =>
      hierarchy.filter(
        (row) =>
          !forbiddenParentIds.has(row.menu.id) &&
          isAllowedParent(type, row.menu),
      ),
    [forbiddenParentIds, hierarchy, type],
  );

  useEffect(() => {
    if (!isOpen) return;
    setType(menu?.type ?? createDefaults?.type ?? 'PAGE');
    setVisible(menu?.visible ?? true);
    setParentId(menu?.parentId ?? createDefaults?.parentId ?? '');
    setModuleId(menu?.moduleId ?? createDefaults?.moduleId ?? '');
    setParentError(null);
    setSubmitError(null);
  }, [createDefaults, isOpen, menu]);

  async function handleSubmit(formData: FormData) {
    if (busy) return;
    setParentError(null);
    setSubmitError(null);

    const normalizedParentId = parentId || null;
    const parent = normalizedParentId
      ? menus.find((item) => item.id === normalizedParentId)
      : null;

    if (type === 'BUTTON' && !parent) {
      setParentError('按钮必须选择一个直属页面。');
      return;
    }
    if (parent && parent.moduleId !== moduleId) {
      setParentError('父节点必须与当前节点属于同一模块。');
      return;
    }
    if (parent && !isAllowedParent(type, parent)) {
      setParentError(
        type === 'BUTTON'
          ? '按钮只能直属页面。'
          : '目录、页面和外链只能放在目录下。',
      );
      return;
    }
    if (normalizedParentId && forbiddenParentIds.has(normalizedParentId)) {
      setParentError('不能选择当前节点或其后代作为父节点。');
      return;
    }

    const payload: MenuPayload = {
      type,
      name: String(formData.get('name') || ''),
    };

    if (!editing) {
      payload.moduleId = moduleId;
    }
    if (!locked) {
      payload.parentId = normalizedParentId;
      payload.description = String(formData.get('description') || '') || null;
      payload.sort = Number(formData.get('sort') || 0);
      payload.status = String(
        formData.get('status') || 'ENABLED',
      ) as MenuDto['status'];
    }

    if (type !== 'BUTTON' && !locked) {
      payload.icon = String(formData.get('icon') || '') || null;
      payload.visible = visible;
    } else if (type !== 'BUTTON') {
      payload.icon = String(formData.get('icon') || '') || null;
    }
    if (!locked && type === 'PAGE') {
      payload.path = String(formData.get('path') || '');
      payload.component = String(formData.get('component') || '') || null;
      payload.permissionCode =
        String(formData.get('permissionCode') || '') || null;
    }
    if (!locked && type === 'LINK') {
      payload.externalUrl = String(formData.get('externalUrl') || '') || null;
      payload.permissionCode =
        String(formData.get('permissionCode') || '') || null;
    }
    if (!locked && type === 'BUTTON') {
      payload.permissionCode =
        String(formData.get('permissionCode') || '') || null;
    }

    try {
      const ok = await onSubmit(payload);
      if (ok) {
        onClose();
        return;
      }
      setSubmitError('保存失败，请检查输入内容或稍后重试。');
    } catch {
      setSubmitError('保存失败，请检查输入内容或稍后重试。');
    }
  }

  function handleClose() {
    if (!busy) onClose();
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      placement="right"
      size={{ base: 'full', md: 'xl' }}
      closeOnEsc={!busy}
      closeOnOverlayClick={!busy}
    >
      <DrawerOverlay />
      <DrawerContent>
        <Box
          as="form"
          key={`${
            menu?.id ??
            `${createDefaults?.parentId ?? 'root'}-${createDefaults?.type ?? 'new'}`
          }-${formSession}`}
          action={handleSubmit}
          display="flex"
          flex="1"
          flexDirection="column"
          minH={0}
        >
          <OverlayCloseButton
            aria-label="关闭节点编辑抽屉"
            isDisabled={busy}
            onClick={handleClose}
          />
          <DrawerHeader pr={12}>
            {editing
              ? '编辑菜单或按钮'
              : presetButton
                ? '新增按钮'
                : '新增菜单或按钮'}
          </DrawerHeader>
          <DrawerBody overflowY="auto">
            <Stack spacing={6} pb={4}>
              {locked ? (
                <Alert status="info">
                  <AlertStatusIcon status="info" />
                  <Box>
                    <AlertTitle>系统节点受保护</AlertTitle>
                    <AlertDescription>
                      所属模块、类型、父级、路由和权限码不可修改。
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : null}
              {error || submitError ? (
                <Alert status="error">
                  <AlertStatusIcon status="error" />
                  <Box>
                    <AlertTitle>保存失败</AlertTitle>
                    <AlertDescription>{error || submitError}</AlertDescription>
                  </Box>
                </Alert>
              ) : null}

              <Stack spacing={4}>
                <Box>
                  <Text color="ink.900" fontWeight="900">
                    基础信息
                  </Text>
                  <Text color="ink.500" fontSize="sm" mt={1}>
                    模块和类型创建后不可修改；按钮必须直属页面。
                  </Text>
                </Box>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>所属模块</FormLabel>
                    <AppSelect
                      value={moduleId}
                      onChange={(event) => {
                        setModuleId(event.target.value);
                        setParentId('');
                      }}
                      isDisabled={editing || presetButton || busy}
                      placeholder="选择模块"
                    >
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.name}
                        </option>
                      ))}
                    </AppSelect>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>类型</FormLabel>
                    <AppSelect
                      value={type}
                      onChange={(event) => {
                        const nextType = event.target.value as MenuDto['type'];
                        setType(nextType);
                        const selectedParent = menus.find(
                          (item) => item.id === parentId,
                        );
                        if (
                          selectedParent &&
                          !isAllowedParent(nextType, selectedParent)
                        ) {
                          setParentId('');
                        }
                        setParentError(null);
                      }}
                      isDisabled={editing || presetButton || busy}
                    >
                      <option value="DIR">目录</option>
                      <option value="PAGE">页面</option>
                      <option value="LINK">外链</option>
                      <option value="BUTTON">按钮</option>
                    </AppSelect>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>
                      {type === 'BUTTON' ? '按钮名称' : '节点名称'}
                    </FormLabel>
                    <Input
                      name="name"
                      defaultValue={menu?.name ?? ''}
                      isDisabled={busy}
                      autoFocus
                    />
                  </FormControl>
                  <FormControl
                    isInvalid={Boolean(parentError)}
                    isRequired={type === 'BUTTON'}
                  >
                    <FormLabel>父节点</FormLabel>
                    <AppSelect
                      value={parentId}
                      onChange={(event) => {
                        setParentId(event.target.value);
                        setParentError(null);
                      }}
                      isDisabled={busy || locked || presetButton}
                    >
                      {type !== 'BUTTON' ? (
                        <option value="">无父级（模块根节点）</option>
                      ) : (
                        <option value="">选择直属页面</option>
                      )}
                      {parentOptions.map((row) => (
                        <option key={row.menu.id} value={row.menu.id}>
                          {getParentOptionLabel(row)}
                        </option>
                      ))}
                    </AppSelect>
                    <FormHelperText>
                      {type === 'BUTTON'
                        ? '按钮只显示同模块页面。'
                        : '仅目录可作为父节点。'}
                    </FormHelperText>
                    <FormErrorMessage>{parentError}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel>描述</FormLabel>
                  <Textarea
                    name="description"
                    defaultValue={menu?.description ?? ''}
                    rows={3}
                    isDisabled={busy}
                  />
                </FormControl>
              </Stack>

              {type !== 'DIR' ? <Divider borderColor="ink.100" /> : null}

              {type === 'PAGE' ? (
                <Stack spacing={4}>
                  <Text color="ink.900" fontWeight="900">
                    页面路由
                  </Text>
                  <FormControl isRequired>
                    <FormLabel>页面路径</FormLabel>
                    <Input
                      name="path"
                      defaultValue={menu?.path ?? ''}
                      isDisabled={busy || locked}
                      placeholder="/admin/system/demo"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>组件标识</FormLabel>
                    <Input
                      name="component"
                      defaultValue={menu?.component ?? ''}
                      isDisabled={busy || locked}
                      placeholder="system/demo/page"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>权限码</FormLabel>
                    <Input
                      name="permissionCode"
                      defaultValue={menu?.permissionCode ?? ''}
                      isDisabled={busy || locked}
                      placeholder="system:demo:view"
                    />
                  </FormControl>
                </Stack>
              ) : null}

              {type === 'LINK' ? (
                <Stack spacing={4}>
                  <Text color="ink.900" fontWeight="900">
                    外链与权限
                  </Text>
                  <FormControl isRequired>
                    <FormLabel>外链地址</FormLabel>
                    <Input
                      name="externalUrl"
                      defaultValue={menu?.externalUrl ?? ''}
                      isDisabled={busy || locked}
                      placeholder="https://example.com"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>权限码</FormLabel>
                    <Input
                      name="permissionCode"
                      defaultValue={menu?.permissionCode ?? ''}
                      isDisabled={busy || locked}
                      placeholder="example:docs:view"
                    />
                  </FormControl>
                </Stack>
              ) : null}

              {type === 'BUTTON' ? (
                <Stack spacing={4}>
                  <Text color="ink.900" fontWeight="900">
                    操作权限
                  </Text>
                  <FormControl isRequired>
                    <FormLabel>权限码</FormLabel>
                    <Input
                      name="permissionCode"
                      defaultValue={menu?.permissionCode ?? ''}
                      isDisabled={busy || locked}
                      placeholder="system:demo:create"
                    />
                    <FormHelperText>
                      页面按钮和对应 API 使用同一个权限码鉴权。
                    </FormHelperText>
                  </FormControl>
                </Stack>
              ) : null}

              <Divider borderColor="ink.100" />

              <Stack spacing={4}>
                <Text color="ink.900" fontWeight="900">
                  状态与排序
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {type !== 'BUTTON' ? (
                    <FormControl>
                      <FormLabel>图标名称</FormLabel>
                      <Input
                        name="icon"
                        defaultValue={menu?.icon ?? ''}
                        placeholder="users / shield / file"
                        isDisabled={busy}
                      />
                    </FormControl>
                  ) : null}
                  <FormControl>
                    <FormLabel>排序</FormLabel>
                    <NumberInput
                      defaultValue={menu?.sort ?? 0}
                      isDisabled={busy}
                    >
                      <NumberInputField name="sort" />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>状态</FormLabel>
                    <AppSelect
                      name="status"
                      defaultValue={menu?.status ?? 'ENABLED'}
                      isDisabled={busy}
                    >
                      <option value="ENABLED">启用</option>
                      <option value="DISABLED">停用</option>
                    </AppSelect>
                  </FormControl>
                </SimpleGrid>
                {type !== 'BUTTON' ? (
                  <Checkbox
                    isChecked={visible}
                    onChange={(event) => setVisible(event.target.checked)}
                    isDisabled={busy}
                  >
                    在导航中显示
                  </Checkbox>
                ) : null}
              </Stack>
            </Stack>
          </DrawerBody>
          <DrawerFooter gap={3} flexDirection={{ base: 'column', sm: 'row' }}>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              isDisabled={busy}
              w={{ base: 'full', sm: 'auto' }}
            >
              取消
            </Button>
            <Button
              type="submit"
              isLoading={busy}
              loadingText="保存中"
              isDisabled={busy}
              w={{ base: 'full', sm: 'auto' }}
            >
              保存
            </Button>
          </DrawerFooter>
        </Box>
      </DrawerContent>
    </Drawer>
  );
}
