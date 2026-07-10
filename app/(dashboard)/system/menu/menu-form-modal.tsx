'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import {
  buildMenuHierarchy,
  collectDescendantIds,
  type MenuHierarchyRow,
} from './menu-hierarchy';

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

type MenuPayload = {
  parentId?: string | null;
  name: string;
  path?: string;
  component?: string | null;
  icon?: string | null;
  sort?: number;
  type?: string;
  permissionCode?: string | null;
  visible?: boolean;
  status?: string;
  externalUrl?: string | null;
};

type MenuFormModalProps = {
  isOpen: boolean;
  isLoading?: boolean;
  menu?: Menu | null;
  menus: Menu[];
  permissions: Permission[];
  onClose: () => void;
  onSubmit: (payload: MenuPayload) => Promise<boolean> | boolean;
};

function getParentOptionLabel(row: MenuHierarchyRow<Menu>) {
  const prefix = row.depth > 0 ? `${'　'.repeat(row.depth - 1)}└─ ` : '';
  return `${prefix}${row.menu.name} · ${row.menu.path || '无路径'}`;
}

export function MenuFormModal({
  isOpen,
  isLoading,
  menu,
  menus,
  permissions,
  onClose,
  onSubmit,
}: MenuFormModalProps) {
  const editing = Boolean(menu);
  const locked = Boolean(menu?.isSystem);
  const busy = Boolean(isLoading);
  const [type, setType] = useState(menu?.type ?? 'PAGE');
  const [visible, setVisible] = useState(menu?.visible ?? true);
  const [parentId, setParentId] = useState(menu?.parentId ?? '');
  const [parentError, setParentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hierarchy = useMemo(() => buildMenuHierarchy(menus), [menus]);
  const forbiddenParentIds = useMemo(() => {
    if (!menu) return new Set<string>();
    return new Set([menu.id, ...collectDescendantIds(menus, menu.id)]);
  }, [menu, menus]);
  const parentOptions = useMemo(
    () => hierarchy.filter((row) => !forbiddenParentIds.has(row.menu.id)),
    [forbiddenParentIds, hierarchy],
  );

  useEffect(() => {
    if (!isOpen) return;
    setType(menu?.type ?? 'PAGE');
    setVisible(menu?.visible ?? true);
    setParentId(menu?.parentId ?? '');
    setParentError(null);
    setSubmitError(null);
  }, [isOpen, menu]);

  async function handleSubmit(formData: FormData) {
    if (busy) return;
    setParentError(null);
    setSubmitError(null);

    const normalizedParentId = parentId || null;
    if (!locked && normalizedParentId) {
      if (!menus.some((item) => item.id === normalizedParentId)) {
        setParentError('所选父菜单已不存在，请重新选择。');
        return;
      }
      if (forbiddenParentIds.has(normalizedParentId)) {
        setParentError('不能选择当前菜单或其后代作为父菜单。');
        return;
      }
    }

    const payload: MenuPayload = {
      name: String(formData.get('name') || ''),
      component: String(formData.get('component') || '') || null,
      icon: String(formData.get('icon') || '') || null,
      sort: Number(formData.get('sort') || 0),
      visible,
      status: String(formData.get('status') || 'ENABLED'),
    };

    if (!locked) {
      payload.parentId = normalizedParentId;
      payload.path = String(formData.get('path') || '');
      payload.type = type;
      payload.permissionCode =
        String(formData.get('permissionCode') || '') || null;
      payload.externalUrl = String(formData.get('externalUrl') || '') || null;
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
          key={menu?.id ?? 'new-menu'}
          action={handleSubmit}
          display="flex"
          flex="1"
          flexDirection="column"
          minH={0}
        >
          <DrawerCloseButton aria-label="关闭菜单编辑抽屉" isDisabled={busy} />
          <DrawerHeader pr={12}>
            {editing ? '编辑菜单' : '新增菜单'}
          </DrawerHeader>
          <DrawerBody overflowY="auto">
            <Stack spacing={6} pb={4}>
              {locked ? (
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>系统菜单受保护</AlertTitle>
                    <AlertDescription>
                      父级、路径、类型、权限码和外链地址不可修改。
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : null}

              {submitError ? (
                <Alert status="error">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>菜单保存失败</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Box>
                </Alert>
              ) : null}

              <Stack spacing={4}>
                <Box>
                  <Text color="ink.900" fontWeight="900">
                    基础信息
                  </Text>
                  <Text color="ink.500" fontSize="sm" mt={1}>
                    定义菜单名称、类型及其在导航树中的位置。
                  </Text>
                </Box>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>菜单名称</FormLabel>
                    <Input
                      name="name"
                      defaultValue={menu?.name ?? ''}
                      isDisabled={busy}
                      autoFocus
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>类型</FormLabel>
                    <Select
                      value={type}
                      onChange={(event) => {
                        setType(event.target.value);
                        setSubmitError(null);
                      }}
                      isDisabled={busy || locked}
                    >
                      <option value="DIR">目录</option>
                      <option value="PAGE">页面</option>
                      <option value="LINK">外链</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <FormControl isInvalid={Boolean(parentError)}>
                  <FormLabel>父菜单</FormLabel>
                  <Select
                    name="parentId"
                    value={parentId}
                    onChange={(event) => {
                      setParentId(event.target.value);
                      setParentError(null);
                      setSubmitError(null);
                    }}
                    isDisabled={busy || locked}
                  >
                    <option value="">无父级（根菜单）</option>
                    {parentOptions.map((row) => (
                      <option key={row.menu.id} value={row.menu.id}>
                        {getParentOptionLabel(row)}
                      </option>
                    ))}
                  </Select>
                  <FormHelperText>
                    选项按菜单树层级排列；编辑时已排除当前节点及其全部后代。
                  </FormHelperText>
                  <FormErrorMessage>{parentError}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>路径</FormLabel>
                  <Input
                    name="path"
                    defaultValue={menu?.path ?? ''}
                    isDisabled={busy || locked}
                    placeholder="/system/demo"
                  />
                </FormControl>
              </Stack>

              <Divider borderColor="ink.100" />

              <Stack spacing={4}>
                <Box>
                  <Text color="ink.900" fontWeight="900">
                    路由与权限
                  </Text>
                  <Text color="ink.500" fontSize="sm" mt={1}>
                    页面填写组件标识，外链填写完整地址，并按需绑定权限码。
                  </Text>
                </Box>
                <FormControl>
                  <FormLabel>权限码</FormLabel>
                  <Select
                    name="permissionCode"
                    defaultValue={menu?.permissionCode ?? ''}
                    isDisabled={busy || locked}
                  >
                    <option value="">不绑定</option>
                    {permissions.map((permission) => (
                      <option key={permission.code} value={permission.code}>
                        {permission.name} / {permission.code}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>组件标识</FormLabel>
                    <Input
                      name="component"
                      defaultValue={menu?.component ?? ''}
                      placeholder="example/page"
                      isDisabled={busy || type !== 'PAGE'}
                    />
                    <FormHelperText>
                      {type === 'PAGE'
                        ? '用于定位页面组件。'
                        : '仅页面类型可填写。'}
                    </FormHelperText>
                  </FormControl>
                  <FormControl>
                    <FormLabel>外链地址</FormLabel>
                    <Input
                      name="externalUrl"
                      defaultValue={menu?.externalUrl ?? ''}
                      placeholder="https://example.com"
                      isDisabled={busy || locked || type !== 'LINK'}
                    />
                    <FormHelperText>
                      {type === 'LINK'
                        ? '建议使用 HTTPS 完整地址。'
                        : '仅外链类型可填写。'}
                    </FormHelperText>
                  </FormControl>
                </SimpleGrid>
              </Stack>

              <Divider borderColor="ink.100" />

              <Stack spacing={4}>
                <Box>
                  <Text color="ink.900" fontWeight="900">
                    展示设置
                  </Text>
                  <Text color="ink.500" fontSize="sm" mt={1}>
                    控制图标、顺序、启停状态和导航可见性。
                  </Text>
                </Box>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>图标名称</FormLabel>
                    <Input
                      name="icon"
                      defaultValue={menu?.icon ?? ''}
                      placeholder="users / shield / file"
                      isDisabled={busy}
                    />
                  </FormControl>
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
                    <Select
                      name="status"
                      defaultValue={menu?.status ?? 'ENABLED'}
                      isDisabled={busy}
                    >
                      <option value="ENABLED">启用</option>
                      <option value="DISABLED">停用</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <Checkbox
                  isChecked={visible}
                  onChange={(event) => {
                    setVisible(event.target.checked);
                    setSubmitError(null);
                  }}
                  isDisabled={busy}
                >
                  在导航中显示
                </Checkbox>
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
