'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Stack,
  Textarea,
} from '@chakra-ui/react';
import type { AppModuleDto } from '@veb/api-contracts';

export type ModulePayload = {
  code?: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sort?: number;
  status?: AppModuleDto['status'];
};

type ModuleFormDrawerProps = {
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  module?: AppModuleDto | null;
  onClose: () => void;
  onSubmit: (payload: ModulePayload) => Promise<boolean> | boolean;
};

export function ModuleFormDrawer({
  isOpen,
  isLoading,
  error,
  module,
  onClose,
  onSubmit,
}: ModuleFormDrawerProps) {
  const editing = Boolean(module);
  const locked = Boolean(module?.isSystem);

  async function handleSubmit(formData: FormData) {
    if (isLoading) return;
    const payload: ModulePayload = {
      name: String(formData.get('name') || ''),
      icon: String(formData.get('icon') || '') || null,
      sort: Number(formData.get('sort') || 0),
    };

    if (!editing) payload.code = String(formData.get('code') || '');
    if (!locked) {
      payload.description = String(formData.get('description') || '') || null;
      payload.status = String(
        formData.get('status') || 'ENABLED',
      ) as AppModuleDto['status'];
    }

    const ok = await onSubmit(payload);
    if (ok) onClose();
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement="right"
      size={{ base: 'full', md: 'lg' }}
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
    >
      <DrawerOverlay />
      <DrawerContent>
        <Box
          as="form"
          key={module?.id ?? 'new-module'}
          action={handleSubmit}
          display="flex"
          flex="1"
          flexDirection="column"
          minH={0}
        >
          <DrawerCloseButton aria-label="关闭模块表单" isDisabled={isLoading} />
          <DrawerHeader>{editing ? '编辑模块' : '新增模块'}</DrawerHeader>
          <DrawerBody>
            <Stack spacing={5}>
              {error ? (
                <Alert status="error" aria-live="polite">
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {locked ? (
                <Alert status="info">
                  <AlertIcon />
                  <AlertDescription>
                    内置模块仅允许修改名称、图标和排序。
                  </AlertDescription>
                </Alert>
              ) : null}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>模块编码</FormLabel>
                  <Input
                    name="code"
                    defaultValue={module?.code ?? ''}
                    isDisabled={editing || isLoading}
                    placeholder="例如 reports"
                    autoComplete="off"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>模块名称</FormLabel>
                  <Input
                    name="name"
                    defaultValue={module?.name ?? ''}
                    isDisabled={isLoading}
                    autoFocus
                  />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>描述</FormLabel>
                <Textarea
                  name="description"
                  defaultValue={module?.description ?? ''}
                  rows={3}
                  isDisabled={locked || isLoading}
                />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl>
                  <FormLabel>图标名称</FormLabel>
                  <Input
                    name="icon"
                    defaultValue={module?.icon ?? ''}
                    isDisabled={isLoading}
                    placeholder="例如 boxes"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>排序</FormLabel>
                  <NumberInput
                    defaultValue={module?.sort ?? 0}
                    isDisabled={isLoading}
                  >
                    <NumberInputField name="sort" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>状态</FormLabel>
                  <Select
                    name="status"
                    defaultValue={module?.status ?? 'ENABLED'}
                    isDisabled={locked || isLoading}
                  >
                    <option value="ENABLED">启用</option>
                    <option value="DISABLED">停用</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
            </Stack>
          </DrawerBody>
          <DrawerFooter gap={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
              取消
            </Button>
            <Button type="submit" isLoading={isLoading}>
              保存
            </Button>
          </DrawerFooter>
        </Box>
      </DrawerContent>
    </Drawer>
  );
}
