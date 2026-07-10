'use client';

import {
  Button,
  Checkbox,
  CheckboxGroup,
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
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

type Role = { id: string; code: string; name: string };
type User = {
  id: string;
  username: string;
  email: string | null;
  nickname: string | null;
  status: string;
  roles: { role: Role }[];
};

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
  user?: User | null;
  roles: Role[];
  onClose: () => void;
  onSubmit: (payload: UserFormPayload) => Promise<boolean> | boolean;
};

export function UserFormModal({
  isOpen,
  isLoading,
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
      payload.password = String(formData.get('password') || 'Admin@123');
      payload.roleIds = roleIds;
    }

    const ok = await onSubmit(payload);
    if (ok) onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay
        bg="rgba(248, 251, 255, 0.62)"
        backdropFilter="blur(16px)"
      />
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
          <ModalHeader>{editing ? '编辑用户' : '新增用户'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={5}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired={!editing}>
                  <FormLabel>用户名</FormLabel>
                  <Input
                    name="username"
                    defaultValue={user?.username ?? ''}
                    isDisabled={editing}
                    placeholder="例如 admin"
                  />
                </FormControl>
                {!editing ? (
                  <FormControl isRequired>
                    <FormLabel>初始密码</FormLabel>
                    <Input
                      name="password"
                      defaultValue="Admin@123"
                      type="password"
                    />
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
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>状态</FormLabel>
                  <Select
                    name="status"
                    defaultValue={user?.status ?? 'ENABLED'}
                  >
                    <option value="ENABLED">启用</option>
                    <option value="DISABLED">禁用</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              {!editing ? (
                <FormControl>
                  <FormLabel>初始角色</FormLabel>
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
        </form>
      </ModalContent>
    </Modal>
  );
}
