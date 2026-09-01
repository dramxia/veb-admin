'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Stack,
  Textarea,
} from '@chakra-ui/react';
import { AppModal } from '@/components/common/managed-overlay';
import type { RoleDto } from '@veb/api-contracts';
import { useEffect, useState } from 'react';
import { AlertStatusIcon } from '@/components/common/alert-status-icon';
import { AppSelect } from '@/components/common/app-select';
import { OverlayCloseButton } from '@/components/common/overlay-close-button';

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
  role?: RoleDto | null;
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
  const busy = Boolean(isLoading);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setSubmitError(null);
  }, [isOpen, role?.id]);

  async function handleSubmit(formData: FormData) {
    if (busy) return;
    setSubmitError(null);

    const payload: RoleFormPayload = {
      name: String(formData.get('name') || ''),
      description: String(formData.get('description') || '') || null,
      status: String(formData.get('status') || 'ENABLED'),
      sort: Number(formData.get('sort') || 0),
    };
    if (!editing || !role?.isSystem) {
      payload.code = String(formData.get('code') || '');
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
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      size={{ base: 'full', md: 'xl' }}
      isCentered
      scrollBehavior="inside"
      closeOnEsc={!busy}
      closeOnOverlayClick={!busy}
    >
      <ModalOverlay />
      <ModalContent>
        <Box
          as="form"
          key={role?.id ?? 'new-role'}
          action={handleSubmit}
          display="flex"
          flex="1"
          flexDirection="column"
          minH={0}
        >
          <ModalHeader>{editing ? '编辑角色' : '新增角色'}</ModalHeader>
          <OverlayCloseButton
            aria-label="关闭角色表单"
            isDisabled={busy}
            onClick={handleClose}
          />
          <ModalBody>
            <Stack spacing={5}>
              {submitError ? (
                <Alert status="error">
                  <AlertStatusIcon status="error" />
                  <Box>
                    <AlertTitle>角色保存失败</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Box>
                </Alert>
              ) : null}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>角色编码</FormLabel>
                  <Input
                    name="code"
                    defaultValue={role?.code ?? ''}
                    isDisabled={busy || Boolean(role?.isSystem)}
                    placeholder="例如 manager"
                    autoFocus={!editing}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>角色名称</FormLabel>
                  <Input
                    name="name"
                    defaultValue={role?.name ?? ''}
                    isDisabled={busy}
                    autoFocus={editing}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>状态</FormLabel>
                  <AppSelect
                    name="status"
                    defaultValue={role?.status ?? 'ENABLED'}
                    isDisabled={busy}
                  >
                    <option value="ENABLED">启用</option>
                    <option value="DISABLED">停用</option>
                  </AppSelect>
                </FormControl>
                <FormControl>
                  <FormLabel>排序</FormLabel>
                  <NumberInput defaultValue={role?.sort ?? 0} isDisabled={busy}>
                    <NumberInputField name="sort" />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>描述</FormLabel>
                <Textarea
                  name="description"
                  defaultValue={role?.description ?? ''}
                  rows={4}
                  isDisabled={busy}
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <HStack
              spacing={3}
              w="full"
              justify="flex-end"
              flexDirection={{ base: 'column', sm: 'row' }}
            >
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
            </HStack>
          </ModalFooter>
        </Box>
      </ModalContent>
    </AppModal>
  );
}
