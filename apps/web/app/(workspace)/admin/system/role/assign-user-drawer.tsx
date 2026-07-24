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
import type {
  RoleDto,
  RoleUserAssignmentDetailDto,
  RoleUserOption,
} from '@veb/api-contracts';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getErrorMessage,
  useActionFeedback,
} from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';
import { useRoleAssignmentDetail } from './use-role-assignment-detail';

type AssignUserDrawerProps = {
  isOpen: boolean;
  role: RoleDto | null;
  onClose: () => void;
};

const EMPTY_USERS: RoleUserOption[] = [];

function getUserDetailPath(roleId: string) {
  return `/api/v1/system/roles/${roleId}/users`;
}

function getUserIds(detail: RoleUserAssignmentDetailDto) {
  return detail.userIds;
}

export function AssignUserDrawer({
  isOpen,
  role,
  onClose,
}: AssignUserDrawerProps) {
  const { loading, run } = useActionFeedback({ refresh: true });
  const [keyword, setKeyword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const activeRoleIdRef = useRef<string | null>(role?.id ?? null);
  activeRoleIdRef.current = role?.id ?? null;

  const detail = useRoleAssignmentDetail<RoleUserAssignmentDetailDto>({
    errorFallback: '用户详情加载失败',
    getPath: getUserDetailPath,
    getSelectedIds: getUserIds,
    isOpen,
    roleId: role?.id ?? null,
  });

  useEffect(() => {
    setKeyword('');
    setSubmitError(null);
  }, [isOpen, role?.id]);

  const users = detail.data?.users ?? EMPTY_USERS;

  const filtered = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return users;
    return users.filter((user) =>
      `${user.username} ${user.nickname ?? ''}`.toLowerCase().includes(value),
    );
  }, [keyword, users]);

  const canEdit = detail.isReady && !loading;
  const detailLoading = detail.status === 'loading';

  async function handleSubmit() {
    const roleId = role?.id;
    if (loading) return;
    if (!isOpen || !roleId || !detail.isReady) {
      setSubmitError('当前角色详情尚未成功加载，请重新加载后再保存。');
      return;
    }

    const userIds = [...detail.selectedIds];
    setSubmitError(null);
    const ok = await run(
      async () => {
        try {
          await requestJson(`/api/v1/system/roles/${roleId}/users`, {
            method: 'POST',
            body: JSON.stringify({ userIds }),
          });
        } catch (error) {
          setSubmitError(getErrorMessage(error, '用户分配保存失败'));
          throw error;
        }
      },
      {
        errorTitle: '用户分配保存失败',
        successTitle: '角色用户已更新',
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
      size={{ base: 'full', md: 'md' }}
      closeOnEsc={!loading}
      closeOnOverlayClick={!loading}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton aria-label="关闭用户分配抽屉" isDisabled={loading} />
        <DrawerHeader>
          <Stack spacing={2} pr={8}>
            <Text>分配用户</Text>
            <HStack spacing={2} wrap="wrap">
              <Badge colorScheme="brand">{role?.name ?? '未选择角色'}</Badge>
              {detail.isReady ? (
                <Badge colorScheme="gray">
                  已选 {detail.selectedIds.length} 人
                </Badge>
              ) : null}
              {detailLoading ? (
                <Badge colorScheme="cyan">详情加载中</Badge>
              ) : null}
              {detail.status === 'error' ? (
                <Badge colorScheme="red">加载失败</Badge>
              ) : null}
            </HStack>
          </Stack>
        </DrawerHeader>
        <DrawerBody overflowY="auto">
          <Stack spacing={4} pb={4}>
            <FormControl>
              <FormLabel htmlFor="role-user-search">筛选用户</FormLabel>
              <Input
                id="role-user-search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索用户名或昵称"
                isDisabled={!detail.isReady || loading}
              />
            </FormControl>

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
              <Stack spacing={3} role="status" aria-label="正在加载角色用户">
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
                    <AlertTitle>用户详情加载失败</AlertTitle>
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
                    请关闭抽屉并重新选择需要分配用户的角色。
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
                  <SimpleGrid columns={1} spacing={3}>
                    {filtered.map((user) => (
                      <Checkbox
                        key={user.id}
                        value={user.id}
                        isDisabled={!canEdit}
                        alignItems="flex-start"
                        borderWidth="1px"
                        borderColor="ink.100"
                        rounded="lg"
                        p={3}
                      >
                        <Stack spacing={1} minW={0}>
                          <Text color="ink.800" fontWeight="800">
                            {user.nickname || user.username}
                          </Text>
                          <Text
                            color="ink.500"
                            fontSize="xs"
                            wordBreak="break-all"
                          >
                            {user.username}
                          </Text>
                        </Stack>
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </CheckboxGroup>
              ) : (
                <Box py={8} textAlign="center">
                  <Text color="ink.500">没有匹配的用户</Text>
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
