'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Checkbox,
  CheckboxGroup,
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
  Text,
} from '@chakra-ui/react';
import type { RoleDto, VebUser } from '@veb/api-contracts';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type RoleSummary = Pick<RoleDto, 'id' | 'code' | 'name'>;

type AssignRolesModalProps = {
  isOpen: boolean;
  isLoading?: boolean;
  error?: ReactNode;
  user: VebUser | null;
  roles: RoleSummary[];
  onClose: () => void;
  onSubmit: (roleIds: string[]) => Promise<boolean> | boolean;
};

export function AssignRolesModal({
  isOpen,
  isLoading,
  error,
  user,
  roles,
  onClose,
  onSubmit,
}: AssignRolesModalProps) {
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setRoleIds(user?.roles.map((item) => item.role.id) ?? []);
    setQuery('');
  }, [isOpen, user]);

  const filteredRoles = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return roles;
    return roles.filter((role) =>
      `${role.name} ${role.code}`.toLowerCase().includes(keyword),
    );
  }, [query, roles]);

  async function handleSubmit() {
    const ok = await onSubmit(roleIds);
    if (ok) onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>分配角色</ModalHeader>
        <ModalCloseButton aria-label="关闭角色分配" />
        <ModalBody>
          <Stack spacing={4}>
            {error ? (
              <Alert status="error" aria-live="polite">
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Text color="ink.600">
              {user?.nickname || user?.username || '当前用户'}
            </Text>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索角色名称或编码"
              aria-label="搜索角色"
            />
            <CheckboxGroup
              value={roleIds}
              onChange={(value) => setRoleIds(value.map(String))}
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {filteredRoles.map((role) => (
                  <Checkbox key={role.id} value={role.id}>
                    {role.name}
                  </Checkbox>
                ))}
              </SimpleGrid>
            </CheckboxGroup>
            {filteredRoles.length === 0 ? (
              <Text color="ink.500" fontSize="sm">
                没有匹配的角色，请调整搜索条件。
              </Text>
            ) : null}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
              取消
            </Button>
            <Button onClick={handleSubmit} isLoading={isLoading}>
              保存
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
