'use client';

import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

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
  const [type, setType] = useState(menu?.type ?? 'PAGE');
  const [visible, setVisible] = useState(menu?.visible ?? true);

  useEffect(() => {
    if (!isOpen) return;
    setType(menu?.type ?? 'PAGE');
    setVisible(menu?.visible ?? true);
  }, [isOpen, menu]);

  async function handleSubmit(formData: FormData) {
    const payload: MenuPayload = {
      name: String(formData.get('name') || ''),
      component: String(formData.get('component') || '') || null,
      icon: String(formData.get('icon') || '') || null,
      sort: Number(formData.get('sort') || 0),
      visible,
      status: String(formData.get('status') || 'ENABLED'),
    };

    if (!locked) {
      payload.parentId = String(formData.get('parentId') || '') || null;
      payload.path = String(formData.get('path') || '');
      payload.type = type;
      payload.permissionCode = String(formData.get('permissionCode') || '') || null;
      payload.externalUrl = String(formData.get('externalUrl') || '') || null;
    }

    const ok = await onSubmit(payload);
    if (ok) onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay bg="rgba(23, 33, 29, 0.24)" backdropFilter="blur(16px)" />
      <ModalContent
        rounded="3xl"
        bg="rgba(255,255,255,0.86)"
        borderWidth="1px"
        borderColor="rgba(255,255,255,0.78)"
        boxShadow="glass"
        sx={{
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        }}
      >
        <form action={handleSubmit}>
          <ModalHeader>{editing ? '编辑菜单' : '新增菜单'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={5}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>菜单名称</FormLabel>
                  <Input name="name" defaultValue={menu?.name ?? ''} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>路径</FormLabel>
                  <Input
                    name="path"
                    defaultValue={menu?.path ?? ''}
                    isDisabled={locked}
                    placeholder="/system/demo"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>类型</FormLabel>
                  <Select
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    isDisabled={locked}
                  >
                    <option value="DIR">目录</option>
                    <option value="PAGE">页面</option>
                    <option value="LINK">外链</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>父菜单</FormLabel>
                  <Select name="parentId" defaultValue={menu?.parentId ?? ''} isDisabled={locked}>
                    <option value="">无父级</option>
                    {menus
                      .filter((item) => item.id !== menu?.id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>权限码</FormLabel>
                  <Select
                    name="permissionCode"
                    defaultValue={menu?.permissionCode ?? ''}
                    isDisabled={locked}
                  >
                    <option value="">不绑定</option>
                    {permissions.map((permission) => (
                      <option key={permission.code} value={permission.code}>
                        {permission.name} / {permission.code}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>组件标识</FormLabel>
                  <Input
                    name="component"
                    defaultValue={menu?.component ?? ''}
                    placeholder="example/page"
                    isDisabled={type !== 'PAGE'}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>外链地址</FormLabel>
                  <Input
                    name="externalUrl"
                    defaultValue={menu?.externalUrl ?? ''}
                    placeholder="https://example.com"
                    isDisabled={locked || type !== 'LINK'}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>图标名称</FormLabel>
                  <Input name="icon" defaultValue={menu?.icon ?? ''} placeholder="users / shield / file" />
                </FormControl>
                <FormControl>
                  <FormLabel>排序</FormLabel>
                  <NumberInput defaultValue={menu?.sort ?? 0}>
                    <NumberInputField name="sort" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>状态</FormLabel>
                  <Select name="status" defaultValue={menu?.status ?? 'ENABLED'}>
                    <option value="ENABLED">启用</option>
                    <option value="DISABLED">禁用</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              <Checkbox isChecked={visible} onChange={(event) => setVisible(event.target.checked)}>
                在导航中显示
              </Checkbox>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
                取消
              </Button>
              <Button type="submit" isLoading={isLoading}>
                保存
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

