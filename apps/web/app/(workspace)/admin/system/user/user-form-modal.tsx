'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Box,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormHelperText,
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
  SimpleGrid,
  Stack,
} from '@chakra-ui/react';
import type { RoleDto, VebUser } from '@veb/api-contracts';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AppSelect } from '@/components/common/app-select';

type RoleSummary = Pick<RoleDto, 'id' | 'code' | 'name'>;

type UserFormPayload = {
  username?: string;
  password?: string;
  email?: string | null;
  nickname?: string | null;
  status: string;
  roleIds?: string[];
};

type UserFormModalProps = {
  isOpen: boolean;
  isLoading?: boolean;
  error?: ReactNode;
  user?: VebUser | null;
  roles: RoleSummary[];
  onClose: () => void;
  onSubmit: (payload: UserFormPayload) => Promise<boolean> | boolean;
};

export function UserFormModal({
  isOpen,
  isLoading,
  error,
  user,
  roles,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const editing = Boolean(user);
  const [roleIds, setRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setRoleIds(user?.roles.map((item) => item.role.id) ?? []);
  }, [isOpen, user]);

  async function handleSubmit(formData: FormData) {
    const payload: UserFormPayload = {
      email: String(formData.get('email') || '') || null,
      nickname: String(formData.get('nickname') || '') || null,
      status: String(formData.get('status') || 'ENABLED'),
    };

    if (!editing) {
      payload.username = String(formData.get('username') || '');
      payload.password = String(formData.get('password') || '');
      payload.roleIds = roleIds;
    }

    const ok = await onSubmit(payload);
    if (ok) onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        <Box
          as="form"
          action={handleSubmit}
          display="flex"
          flex="1"
          flexDirection="column"
          minH={0}
        >
          <ModalHeader>{editing ? '编辑用户' : '新增用户'}</ModalHeader>
          <ModalCloseButton aria-label="关闭用户表单" />
          <ModalBody>
            <Stack spacing={5}>
              {error ? (
                <Alert status="error" aria-live="polite">
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired={!editing}>
                  <FormLabel>用户名</FormLabel>
                  <Input
                    name="username"
                    defaultValue={user?.username ?? ''}
                    isDisabled={editing}
                    placeholder="例如 admin"
                    autoComplete="off"
                  />
                </FormControl>
                {!editing ? (
                  <FormControl isRequired>
                    <FormLabel>初始密码</FormLabel>
                    <Input
                      name="password"
                      type="password"
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="至少 6 个字符"
                    />
                    <FormHelperText>请使用独立的初始密码。</FormHelperText>
                  </FormControl>
                ) : null}
                <FormControl>
                  <FormLabel>昵称</FormLabel>
                  <Input name="nickname" defaultValue={user?.nickname ?? ''} />
                </FormControl>
                <FormControl>
                  <FormLabel>邮箱</FormLabel>
                  <Input
                    name="email"
                    defaultValue={user?.email ?? ''}
                    type="email"
                    autoComplete="email"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>状态</FormLabel>
                  <AppSelect
                    name="status"
                    defaultValue={user?.status ?? 'ENABLED'}
                  >
                    <option value="ENABLED">启用</option>
                    <option value="DISABLED">禁用</option>
                  </AppSelect>
                </FormControl>
              </SimpleGrid>

              {!editing ? (
                <FormControl>
                  <FormLabel>初始角色</FormLabel>
                  <Stack maxH="240px" overflowY="auto" pr={2}>
                    <CheckboxGroup
                      value={roleIds}
                      onChange={(value) => setRoleIds(value.map(String))}
                    >
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        {roles.map((role) => (
                          <Checkbox key={role.id} value={role.id}>
                            {role.name}
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </CheckboxGroup>
                  </Stack>
                </FormControl>
              ) : null}
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
        </Box>
      </ModalContent>
    </Modal>
  );
}
