'use client';

import {
  Button,
  Checkbox,
  CheckboxGroup,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

type Role = { id: string; code: string; name: string };
type User = {
  id: string;
  username: string;
  nickname: string | null;
  roles: { role: Role }[];
};

type AssignRolesModalProps = {
  isOpen: boolean;
  isLoading?: boolean;
  user: User | null;
  roles: Role[];
  onClose: () => void;
  onSubmit: (roleIds: string[]) => Promise<boolean> | boolean;
};

export function AssignRolesModal({
  isOpen,
  isLoading,
  user,
  roles,
  onClose,
  onSubmit,
}: AssignRolesModalProps) {
  const [roleIds, setRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setRoleIds(user?.roles.map((item) => item.role.id) ?? []);
  }, [isOpen, user]);

  async function handleSubmit() {
    const ok = await onSubmit(roleIds);
    if (ok) onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
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
        <ModalHeader>分配角色</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text color="surface.600">
              {user?.nickname || user?.username || '当前用户'}
            </Text>
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
          </VStack>
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
