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
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Stack,
  Textarea,
} from '@chakra-ui/react';

type Role = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  sort: number;
  isSystem: boolean;
};

type RoleFormPayload = {
  code?: string;
  name: string;
  description?: string | null;
  status: string;
  sort: number;
};

type RoleFormModalProps = {
  isOpen: boolean;
  isLoading?: boolean;
  role?: Role | null;
  onClose: () => void;
  onSubmit: (payload: RoleFormPayload) => Promise<boolean> | boolean;
};

export function RoleFormModal({
  isOpen,
  isLoading,
  role,
  onClose,
  onSubmit,
}: RoleFormModalProps) {
  const editing = Boolean(role);

  async function handleSubmit(formData: FormData) {
    const payload: RoleFormPayload = {
      name: String(formData.get('name') || ''),
      description: String(formData.get('description') || '') || null,
      status: String(formData.get('status') || 'ENABLED'),
      sort: Number(formData.get('sort') || 0),
    };
    if (!editing || !role?.isSystem) payload.code = String(formData.get('code') || '');

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
          <ModalHeader>{editing ? '编辑角色' : '新增角色'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={5}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>角色编码</FormLabel>
                  <Input
                    name="code"
                    defaultValue={role?.code ?? ''}
                    isDisabled={Boolean(role?.isSystem)}
                    placeholder="例如 manager"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>角色名称</FormLabel>
                  <Input name="name" defaultValue={role?.name ?? ''} />
                </FormControl>
                <FormControl>
                  <FormLabel>状态</FormLabel>
                  <Select name="status" defaultValue={role?.status ?? 'ENABLED'}>
                    <option value="ENABLED">启用</option>
                    <option value="DISABLED">禁用</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>排序</FormLabel>
                  <NumberInput defaultValue={role?.sort ?? 0}>
                    <NumberInputField name="sort" />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>描述</FormLabel>
                <Textarea name="description" defaultValue={role?.description ?? ''} rows={4} />
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

