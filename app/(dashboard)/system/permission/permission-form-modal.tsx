'use client';

import {
  Button,
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
  Select,
  SimpleGrid,
  Stack,
  Textarea,
} from '@chakra-ui/react';

type Permission = {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  isSystem: boolean;
};

type PermissionPayload = {
  code?: string;
  name: string;
  type?: string;
  description?: string | null;
};

type PermissionFormModalProps = {
  isOpen: boolean;
  isLoading?: boolean;
  permission?: Permission | null;
  onClose: () => void;
  onSubmit: (payload: PermissionPayload) => Promise<boolean> | boolean;
};

export function PermissionFormModal({
  isOpen,
  isLoading,
  permission,
  onClose,
  onSubmit,
}: PermissionFormModalProps) {
  const editing = Boolean(permission);

  async function handleSubmit(formData: FormData) {
    const payload: PermissionPayload = {
      name: String(formData.get('name') || ''),
      description: String(formData.get('description') || '') || null,
    };
    if (!editing || !permission?.isSystem) payload.code = String(formData.get('code') || '');
    if (!editing) payload.type = String(formData.get('type') || 'BUTTON');

    const ok = await onSubmit(payload);
    if (ok) onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
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
          <ModalHeader>{editing ? '编辑权限' : '新增权限'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={5}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>权限码</FormLabel>
                  <Input
                    name="code"
                    defaultValue={permission?.code ?? ''}
                    isDisabled={Boolean(permission?.isSystem)}
                    placeholder="例如 system:demo:view"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>权限名称</FormLabel>
                  <Input name="name" defaultValue={permission?.name ?? ''} />
                </FormControl>
                {!editing ? (
                  <FormControl>
                    <FormLabel>类型</FormLabel>
                    <Select name="type" defaultValue="BUTTON">
                      <option value="BUTTON">按钮</option>
                      <option value="MENU">菜单</option>
                    </Select>
                  </FormControl>
                ) : null}
              </SimpleGrid>
              <FormControl>
                <FormLabel>描述</FormLabel>
                <Textarea name="description" defaultValue={permission?.description ?? ''} rows={4} />
              </FormControl>
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

