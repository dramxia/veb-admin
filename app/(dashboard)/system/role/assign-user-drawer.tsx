'use client';

import {
  Badge,
  Button,
  Checkbox,
  CheckboxGroup,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';

type Role = {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
};
type User = { id: string; username: string; nickname: string | null };
type RoleDetail = Role & {
  users: { user: User }[];
};

type AssignUserDrawerProps = {
  isOpen: boolean;
  role: Role | null;
  users: User[];
  onClose: () => void;
};

export function AssignUserDrawer({
  isOpen,
  role,
  users,
  onClose,
}: AssignUserDrawerProps) {
  const { loading, run } = useActionFeedback({ refresh: true });
  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !role) return;
    let alive = true;
    setDetailLoading(true);
    requestJson<RoleDetail>(`/api/system/roles/${role.id}`)
      .then((detail) => {
        if (!alive) return;
        setSelectedIds(detail.users.map((item) => item.user.id));
      })
      .catch((error) => {
        if (!alive) return;
        toast({
          title: error instanceof Error ? error.message : '用户详情加载失败',
          status: 'error',
        });
      })
      .finally(() => {
        if (alive) setDetailLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [isOpen, role, toast]);

  const filtered = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return users;
    return users.filter((user) =>
      `${user.username} ${user.nickname ?? ''}`.toLowerCase().includes(value),
    );
  }, [keyword, users]);

  async function handleSubmit() {
    if (!role) return;
    await run(async () => {
      await requestJson(`/api/system/roles/${role.id}/users`, {
        method: 'POST',
        body: JSON.stringify({ userIds: selectedIds }),
      });
      onClose();
    });
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
      <DrawerOverlay bg="rgba(23, 33, 29, 0.24)" backdropFilter="blur(16px)" />
      <DrawerContent
        bg="rgba(255,255,255,0.86)"
        borderLeftWidth="1px"
        borderLeftColor="rgba(255,255,255,0.78)"
        boxShadow="glass"
        sx={{
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        }}
      >
        <DrawerCloseButton />
        <DrawerHeader>
          <Stack spacing={2}>
            <Text>分配用户</Text>
            <HStack spacing={2} wrap="wrap">
              <Badge colorScheme="green">{role?.name ?? '-'}</Badge>
              <Badge>{selectedIds.length} 人</Badge>
            </HStack>
          </Stack>
        </DrawerHeader>
        <DrawerBody>
          <Stack spacing={4}>
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索用户名或昵称" />
            <CheckboxGroup value={selectedIds} onChange={(value) => setSelectedIds(value.map(String))}>
              <SimpleGrid columns={1} spacing={3}>
                {filtered.map((user) => (
                  <Checkbox key={user.id} value={user.id} isDisabled={loading || detailLoading}>
                    <Stack spacing={0}>
                      <Text fontWeight="800">{user.nickname || user.username}</Text>
                      <Text color="surface.500" fontSize="xs">
                        {user.username}
                      </Text>
                    </Stack>
                  </Checkbox>
                ))}
              </SimpleGrid>
            </CheckboxGroup>
          </Stack>
        </DrawerBody>
        <DrawerFooter gap={3}>
          <Button variant="ghost" onClick={onClose} isDisabled={loading || detailLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} isLoading={loading || detailLoading}>
            保存
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
