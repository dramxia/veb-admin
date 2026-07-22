'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
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
  FormControl,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import type { PermissionDto, RoleDetailDto, RoleDto } from '@veb/api-contracts';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getErrorMessage,
  useActionFeedback,
} from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';
import { useRoleAssignmentDetail } from './use-role-assignment-detail';

type AssignPermissionDrawerProps = {
  isOpen: boolean;
  role: RoleDto | null;
  permissions: PermissionDto[];
  onClose: () => void;
};

function getPermissionIds(detail: RoleDetailDto) {
  return detail.permissions.map((item) => item.permission.id);
}

export function AssignPermissionDrawer({
  isOpen,
  role,
  permissions,
  onClose,
}: AssignPermissionDrawerProps) {
  const { loading, run } = useActionFeedback({ refresh: true });
  const [keyword, setKeyword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const activeRoleIdRef = useRef<string | null>(role?.id ?? null);
  activeRoleIdRef.current = role?.id ?? null;

  const detail = useRoleAssignmentDetail<RoleDetailDto>({
    errorFallback: '权限详情加载失败',
    getSelectedIds: getPermissionIds,
    isOpen,
    roleId: role?.id ?? null,
  });

  useEffect(() => {
    setKeyword('');
    setSubmitError(null);
  }, [isOpen, role?.id]);

  const filtered = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return permissions;
    return permissions.filter((permission) =>
      `${permission.code} ${permission.name} ${permission.type}`
        .toLowerCase()
        .includes(value),
    );
  }, [keyword, permissions]);

  const locked = Boolean(role?.isSystem && role.code === 'superadmin');
  const canEdit = detail.isReady && !locked && !loading;
  const detailLoading = detail.status === 'loading';

  async function handleSubmit() {
    const roleId = role?.id;
    if (loading) return;
    if (!isOpen || !roleId || !detail.isReady) {
      setSubmitError('当前角色详情尚未成功加载，请重新加载后再保存。');
      return;
    }
    if (locked) {
      setSubmitError('超级管理员权限由系统锁定，不能修改。');
      return;
    }

    const permissionIds = [...detail.selectedIds];
    setSubmitError(null);
    const ok = await run(
      async () => {
        try {
          await requestJson(`/api/v1/system/roles/${roleId}/permissions`, {
            method: 'POST',
            body: JSON.stringify({ permissionIds }),
          });
        } catch (error) {
          setSubmitError(getErrorMessage(error, '权限保存失败'));
          throw error;
        }
      },
      {
        errorTitle: '权限保存失败',
        successTitle: '角色权限已更新',
      },
    );

    if (ok && activeRoleIdRef.current === roleId) onClose();
  }

  function handleClose() {
    if (!loading) onClose();
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      placement="right"
      size={{ base: 'full', md: 'lg' }}
      closeOnEsc={!loading}
      closeOnOverlayClick={!loading}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton aria-label="关闭权限分配抽屉" isDisabled={loading} />
        <DrawerHeader>
          <Stack spacing={2} pr={8}>
            <Text>分配权限</Text>
            <HStack spacing={2} wrap="wrap">
              <Badge colorScheme="brand">{role?.name ?? '未选择角色'}</Badge>
              {detail.isReady ? (
                <Badge colorScheme="gray">
                  已选 {detail.selectedIds.length} 项
                </Badge>
              ) : null}
              {detailLoading ? (
                <Badge colorScheme="cyan">详情加载中</Badge>
              ) : null}
              {detail.status === 'error' ? (
                <Badge colorScheme="red">加载失败</Badge>
              ) : null}
              {locked ? <Badge colorScheme="red">系统锁定</Badge> : null}
            </HStack>
          </Stack>
        </DrawerHeader>
        <DrawerBody overflowY="auto">
          <Stack spacing={4} pb={4}>
            <FormControl>
              <FormLabel htmlFor="permission-search">筛选权限</FormLabel>
              <Input
                id="permission-search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索权限码、名称或类型"
                isDisabled={!detail.isReady || loading}
              />
            </FormControl>

            {locked && detail.isReady ? (
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>权限已锁定</AlertTitle>
                  <AlertDescription>
                    超级管理员始终拥有完整权限，此处仅供查看。
                  </AlertDescription>
                </Box>
              </Alert>
            ) : null}

            {submitError ? (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <AlertTitle>无法保存</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Box>
              </Alert>
            ) : null}

            {detailLoading ? (
              <Stack spacing={3} role="status" aria-label="正在加载角色权限">
                <Skeleton h="64px" rounded="lg" />
                <Skeleton h="64px" rounded="lg" />
                <Skeleton h="64px" rounded="lg" />
              </Stack>
            ) : null}

            {detail.status === 'error' ? (
              <Alert
                status="error"
                alignItems="flex-start"
                flexDirection="column"
                gap={3}
              >
                <HStack align="flex-start" spacing={2}>
                  <AlertIcon mt={1} />
                  <Box>
                    <AlertTitle>权限详情加载失败</AlertTitle>
                    <AlertDescription>
                      {detail.error ?? '请稍后重试。'}
                    </AlertDescription>
                  </Box>
                </HStack>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                  onClick={detail.retry}
                >
                  重新加载
                </Button>
              </Alert>
            ) : null}

            {detail.status === 'idle' && isOpen ? (
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>未选择角色</AlertTitle>
                  <AlertDescription>
                    请关闭抽屉并重新选择需要分配权限的角色。
                  </AlertDescription>
                </Box>
              </Alert>
            ) : null}

            {detail.isReady ? (
              filtered.length > 0 ? (
                <CheckboxGroup
                  value={detail.selectedIds}
                  onChange={(value) => {
                    if (!canEdit) return;
                    setSubmitError(null);
                    detail.setSelectedIds(value.map(String));
                  }}
                >
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {filtered.map((permission) => (
                      <Checkbox
                        key={permission.id}
                        value={permission.id}
                        isDisabled={!canEdit}
                        alignItems="flex-start"
                        borderWidth="1px"
                        borderColor="ink.100"
                        rounded="lg"
                        p={3}
                      >
                        <Stack spacing={1} minW={0}>
                          <HStack spacing={2} wrap="wrap">
                            <Text color="ink.800" fontWeight="800">
                              {permission.name}
                            </Text>
                            <Badge colorScheme="gray">{permission.type}</Badge>
                          </HStack>
                          <Text
                            color="ink.500"
                            fontSize="xs"
                            wordBreak="break-all"
                          >
                            {permission.code}
                          </Text>
                        </Stack>
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </CheckboxGroup>
              ) : (
                <Box py={8} textAlign="center">
                  <Text color="ink.500">没有匹配的权限</Text>
                </Box>
              )
            ) : null}
          </Stack>
        </DrawerBody>
        <DrawerFooter gap={3} flexDirection={{ base: 'column', sm: 'row' }}>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            isDisabled={loading}
            w={{ base: 'full', sm: 'auto' }}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={loading || detailLoading}
            loadingText={detailLoading ? '加载详情' : '保存中'}
            isDisabled={!canEdit}
            w={{ base: 'full', sm: 'auto' }}
          >
            保存
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
