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
type Permission = { id: string; code: string; name: string; type: string };
type RoleDetail = Role & {
  permissions: { permission: Permission }[];
};

type AssignPermissionDrawerProps = {
  isOpen: boolean;
  role: Role | null;
  permissions: Permission[];
  onClose: () => void;
};

export function AssignPermissionDrawer({
  isOpen,
  role,
  permissions,
  onClose,
}: AssignPermissionDrawerProps) {
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
        setSelectedIds(detail.permissions.map((item) => item.permission.id));
      })
      .catch((error) => {
        if (!alive) return;
        toast({
          title: error instanceof Error ? error.message : '权限详情加载失败',
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
    if (!value) return permissions;
    return permissions.filter((permission) =>
      `${permission.code} ${permission.name} ${permission.type}`
        .toLowerCase()
        .includes(value),
    );
  }, [keyword, permissions]);

  async function handleSubmit() {
    if (!role) return;
    await run(async () => {
      await requestJson(`/api/system/roles/${role.id}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ permissionIds: selectedIds }),
      });
      onClose();
    });
  }

  const locked = Boolean(role?.isSystem && role.code === 'superadmin');

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="lg">
      <DrawerOverlay
        bg="rgba(248, 251, 255, 0.62)"
        backdropFilter="blur(16px)"
      />
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
            <Text>分配权限</Text>
            <HStack spacing={2} wrap="wrap">
              <Badge colorScheme="brand">{role?.name ?? '-'}</Badge>
              {locked ? <Badge colorScheme="red">超级管理员锁定</Badge> : null}
            </HStack>
          </Stack>
        </DrawerHeader>
        <DrawerBody>
          <Stack spacing={4}>
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索权限码或名称"
            />
            <CheckboxGroup
              value={selectedIds}
              onChange={(value) => setSelectedIds(value.map(String))}
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {filtered.map((permission) => (
                  <Checkbox
                    key={permission.id}
                    value={permission.id}
                    isDisabled={locked || loading || detailLoading}
                  >
                    <Stack spacing={0}>
                      <Text fontWeight="800">{permission.name}</Text>
                      <Text color="surface.500" fontSize="xs">
                        {permission.code}
                      </Text>
                    </Stack>
                  </Checkbox>
                ))}
              </SimpleGrid>
            </CheckboxGroup>
          </Stack>
        </DrawerBody>
        <DrawerFooter gap={3}>
          <Button
            variant="ghost"
            onClick={onClose}
            isDisabled={loading || detailLoading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={loading || detailLoading}
            isDisabled={locked}
          >
            保存
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
