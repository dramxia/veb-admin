'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Button,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import type { AppModuleDto } from '@veb/api-contracts';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  DataTableCard,
  EmptyTableRow,
  TableActions,
} from '@/components/common/data-table';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';
import { ModuleFormDrawer, type ModulePayload } from './module-form-drawer';

export function ModuleTable({ modules }: { modules: AppModuleDto[] }) {
  const { clearError, error, loading, run } = useActionFeedback({
    refresh: true,
  });
  const formDrawer = useDisclosure();
  const deleteDialog = useDisclosure();
  const [query, setQuery] = useState('');
  const [editingModule, setEditingModule] = useState<AppModuleDto | null>(null);
  const [deletingModule, setDeletingModule] = useState<AppModuleDto | null>(
    null,
  );
  const filteredModules = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return modules;
    return modules.filter((module) =>
      `${module.code} ${module.name} ${module.description ?? ''}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [modules, query]);

  async function submitModule(payload: ModulePayload) {
    return run(async () => {
      await requestJson(
        editingModule
          ? `/api/v1/system/modules/${editingModule.id}`
          : '/api/v1/system/modules',
        {
          method: editingModule ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        },
      );
    });
  }

  return (
    <>
      <DataTableCard
        minW="900px"
        title="应用模块"
        description="顶栏仅展示角色已获且当前启用的模块。"
        meta={`${filteredModules.length} / ${modules.length} 个模块`}
        toolbar={
          <Stack spacing={3}>
            {error ? (
              <Alert status="error" aria-live="polite">
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <InputGroup maxW={{ base: 'full', md: '360px' }}>
              <InputLeftElement pointerEvents="none" color="ink.400">
                <Icon as={Search} boxSize={4} />
              </InputLeftElement>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索名称、编码或描述"
                aria-label="搜索模块"
                pl={10}
              />
            </InputGroup>
          </Stack>
        }
        primaryAction={
          <AuthButton
            code="system:module:create"
            icon={<Icon as={Plus} boxSize={4} />}
            isLoading={loading}
            onClick={() => {
              clearError();
              setEditingModule(null);
              formDrawer.onOpen();
            }}
          >
            新增模块
          </AuthButton>
        }
      >
        <Table size="sm" aria-label="应用模块列表">
          <Thead>
            <Tr>
              <Th>模块</Th>
              <Th>描述</Th>
              <Th>状态</Th>
              <Th isNumeric>排序</Th>
              <Th isNumeric>菜单</Th>
              <Th isNumeric>按钮</Th>
              <Th isNumeric>角色</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {filteredModules.length ? (
            <Tbody>
              {filteredModules.map((module) => (
                <Tr key={module.id}>
                  <Td>
                    <Stack spacing={1} minW="140px">
                      <Text color="ink.800" fontWeight="800">
                        {module.name}
                      </Text>
                      <Text color="ink.500" fontSize="xs">
                        {module.code}
                      </Text>
                    </Stack>
                  </Td>
                  <Td>
                    <Text color="ink.600" fontSize="sm" noOfLines={2}>
                      {module.description || '暂无描述'}
                    </Text>
                  </Td>
                  <Td>
                    <Stack align="flex-start" spacing={1}>
                      <Badge
                        colorScheme={
                          module.status === 'ENABLED' ? 'green' : 'red'
                        }
                      >
                        {module.status === 'ENABLED' ? '启用' : '停用'}
                      </Badge>
                      {module.isSystem ? (
                        <Badge colorScheme="purple">系统内置</Badge>
                      ) : null}
                      {module._count.menus === 0 ? (
                        <Badge colorScheme="orange">待配置菜单</Badge>
                      ) : null}
                    </Stack>
                  </Td>
                  <Td isNumeric>{module.sort}</Td>
                  <Td isNumeric>{module._count.menus}</Td>
                  <Td isNumeric>{module._count.buttons}</Td>
                  <Td isNumeric>{module._count.roles}</Td>
                  <Td>
                    <TableActions>
                      <AuthButton
                        code="system:module:update"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="编辑模块"
                        icon={<Icon as={Pencil} boxSize={4} />}
                        isDisabled={loading}
                        onClick={() => {
                          clearError();
                          setEditingModule(module);
                          formDrawer.onOpen();
                        }}
                      />
                      <AuthButton
                        code="system:module:delete"
                        size="xs"
                        intent="danger"
                        variant="ghost"
                        tooltip={
                          module.isSystem ? '内置模块不可删除' : '删除模块'
                        }
                        icon={<Icon as={Trash2} boxSize={4} />}
                        isDisabled={loading || module.isSystem}
                        onClick={() => {
                          clearError();
                          setDeletingModule(module);
                          deleteDialog.onOpen();
                        }}
                      />
                    </TableActions>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          ) : (
            <EmptyTableRow
              colSpan={8}
              text={modules.length ? '没有匹配的模块' : '暂无模块'}
              action={
                modules.length ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuery('')}
                  >
                    清除搜索
                  </Button>
                ) : undefined
              }
            />
          )}
        </Table>
      </DataTableCard>

      <ModuleFormDrawer
        isOpen={formDrawer.isOpen}
        isLoading={loading}
        error={error}
        module={editingModule}
        onClose={() => {
          clearError();
          formDrawer.onClose();
        }}
        onSubmit={submitModule}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="删除模块"
        description={`确认删除模块 ${deletingModule?.name ?? ''}？有关联菜单、按钮或角色时会被拒绝。`}
        error={error}
        confirmLabel="删除"
        intent="danger"
        isLoading={loading}
        onClose={() => {
          clearError();
          deleteDialog.onClose();
        }}
        onConfirm={async () => {
          const ok = await run(async () => {
            if (!deletingModule) return;
            await requestJson(`/api/v1/system/modules/${deletingModule.id}`, {
              method: 'DELETE',
            });
          });
          if (ok) deleteDialog.onClose();
        }}
      />
    </>
  );
}
