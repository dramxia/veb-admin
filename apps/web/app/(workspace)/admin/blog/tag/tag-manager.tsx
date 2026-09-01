'use client';

import {
  Alert,
  AlertDescription,
  Box,
  Button,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
import { AppDrawer, AppModal } from '@/components/common/managed-overlay';
import type { AdminTag } from '@veb/api-contracts';
import {
  AddIcon,
  ArticlesIcon,
  DeleteIcon,
  EditIcon,
  EditorPreviewIcon,
  SearchIcon,
} from '@/assets/icons';
import { ArticlePreviewModal } from '@/components/blog/article-preview-modal';
import { AlertStatusIcon } from '@/components/common/alert-status-icon';
import { LocalIcon } from '@/components/common/local-icon';
import { OverlayCloseButton } from '@/components/common/overlay-close-button';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  DataTableCard,
  EmptyTableRow,
  TableActions,
} from '@/components/common/data-table';
import { PaginationControls } from '@/components/common/pagination-controls';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import type {
  ArticleListItem,
  PageResult,
} from '@/components/blog/admin-types';
import { requestJson } from '@/lib/client-api';

export function TagManager({ initial }: { initial: PageResult<AdminTag> }) {
  const [data, setData] = useState(initial);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');
  const [editing, setEditing] = useState<AdminTag | null>(null);
  const [deleting, setDeleting] = useState<AdminTag | null>(null);
  const [viewing, setViewing] = useState<AdminTag | null>(null);
  const [previewing, setPreviewing] = useState<ArticleListItem | null>(null);
  const [related, setRelated] = useState<PageResult<ArticleListItem> | null>(
    null,
  );
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const form = useDisclosure();
  const confirm = useDisclosure();
  const drawer = useDisclosure();
  const feedback = useActionFeedback();

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (keyword.trim()) query.set('keyword', keyword.trim());
      setData(
        await requestJson<PageResult<AdminTag>>(
          `/api/v1/blog/manage/tags?${query}`,
        ),
      );
    } catch (error) {
      setListError(error instanceof Error ? error.message : '标签列表加载失败');
    } finally {
      setLoadingList(false);
    }
  }, [keyword, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadList(), 250);
    return () => window.clearTimeout(timer);
  }, [loadList]);

  function openForm(tag?: AdminTag) {
    setEditing(tag || null);
    setFormName(tag?.name || '');
    setFormSlug(tag?.slug || '');
    form.onOpen();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const ok = await feedback.run(
      async () => {
        await requestJson(
          editing
            ? `/api/v1/blog/manage/tags/${editing.id}`
            : '/api/v1/blog/manage/tags',
          {
            method: editing ? 'PATCH' : 'POST',
            body: JSON.stringify({
              name: formName,
              slug: formSlug || undefined,
            }),
          },
        );
      },
      { successTitle: editing ? '标签已更新' : '标签已创建' },
    );
    if (ok) {
      form.onClose();
      await loadList();
    }
  }

  async function openRelated(tag: AdminTag) {
    setViewing(tag);
    setPreviewing(null);
    setRelated(null);
    drawer.onOpen();
    try {
      setRelated(
        await requestJson<PageResult<ArticleListItem>>(
          `/api/v1/blog/manage/tags/${tag.id}/articles?page=1&pageSize=100`,
        ),
      );
    } catch {
      setRelated({ items: [], total: 0, page: 1, pageSize: 100 });
    }
  }

  function closeRelated() {
    setPreviewing(null);
    drawer.onClose();
  }

  return (
    <>
      <DataTableCard
        minW="760px"
        title="标签列表"
        meta={`${data.total} 个标签`}
        primaryAction={
          <AuthButton
            code="blog:tag:create"
            icon={<LocalIcon icon={AddIcon} />}
            onClick={() => openForm()}
          >
            新增标签
          </AuthButton>
        }
        toolbar={
          <Stack spacing={3}>
            {listError ? (
              <Alert status="error">
                <AlertStatusIcon status="error" />
                <AlertDescription>{listError}</AlertDescription>
              </Alert>
            ) : null}
            <InputGroup maxW="360px">
              <InputLeftElement>
                <LocalIcon icon={SearchIcon} color="ink.400" />
              </InputLeftElement>
              <Input
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(1);
                }}
                placeholder="搜索名称或 slug"
                pl={10}
              />
            </InputGroup>
          </Stack>
        }
      >
        <Table size="sm" aria-busy={loadingList}>
          <Thead>
            <Tr>
              <Th>名称</Th>
              <Th>Slug</Th>
              <Th isNumeric>关联文章</Th>
              <Th>更新时间</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {data.items.length ? (
            <Tbody>
              {data.items.map((tag) => (
                <Tr key={tag.id}>
                  <Td fontWeight="700" color="ink.800">
                    {tag.name}
                  </Td>
                  <Td color="ink.500">{tag.slug}</Td>
                  <Td isNumeric>{tag.articleCount}</Td>
                  <Td>
                    {new Intl.DateTimeFormat('zh-CN').format(
                      new Date(tag.updatedAt),
                    )}
                  </Td>
                  <Td>
                    <TableActions>
                      <AuthButton
                        code="blog:tag:view"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="查看关联文章"
                        icon={<LocalIcon icon={ArticlesIcon} />}
                        onClick={() => void openRelated(tag)}
                      />
                      <AuthButton
                        code="blog:tag:update"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="编辑标签"
                        icon={<LocalIcon icon={EditIcon} />}
                        onClick={() => openForm(tag)}
                      />
                      <AuthButton
                        code="blog:tag:delete"
                        size="xs"
                        intent="danger"
                        variant="ghost"
                        tooltip="删除标签"
                        icon={<LocalIcon icon={DeleteIcon} />}
                        onClick={() => {
                          setDeleting(tag);
                          confirm.onOpen();
                        }}
                      />
                    </TableActions>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          ) : (
            <EmptyTableRow
              colSpan={5}
              text="暂无标签"
              description="创建标签后即可关联文章。"
            />
          )}
        </Table>
        <PaginationControls
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          disabled={loadingList}
          onPageChange={setPage}
        />
      </DataTableCard>

      <AppModal isOpen={form.isOpen} onClose={form.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <Box as="form" onSubmit={submit}>
            <ModalHeader>{editing ? '编辑标签' : '新增标签'}</ModalHeader>
            <OverlayCloseButton
              aria-label="关闭标签表单"
              onClick={form.onClose}
            />
            <ModalBody>
              <Stack spacing={4}>
                {feedback.error ? (
                  <Alert status="error">
                    <AlertStatusIcon status="error" />
                    <AlertDescription>{feedback.error}</AlertDescription>
                  </Alert>
                ) : null}
                <FormControl isRequired>
                  <FormLabel>名称</FormLabel>
                  <Input
                    value={formName}
                    maxLength={40}
                    onChange={(event) => setFormName(event.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Slug</FormLabel>
                  <Input
                    value={formSlug}
                    maxLength={60}
                    onChange={(event) => setFormSlug(event.target.value)}
                    placeholder="留空时自动生成"
                  />
                  <FormHelperText>公开标签筛选地址使用该值。</FormHelperText>
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <HStack>
                <Button variant="ghost" onClick={form.onClose}>
                  取消
                </Button>
                <Button type="submit" isLoading={feedback.loading}>
                  保存
                </Button>
              </HStack>
            </ModalFooter>
          </Box>
        </ModalContent>
      </AppModal>

      <AppDrawer
        isOpen={drawer.isOpen}
        placement="right"
        size="md"
        onClose={closeRelated}
      >
        <DrawerOverlay />
        <DrawerContent data-testid="related-articles-drawer">
          <OverlayCloseButton
            aria-label="关闭关联文章抽屉"
            onClick={closeRelated}
          />
          <DrawerHeader>{viewing?.name} · 关联文章</DrawerHeader>
          <DrawerBody>
            <Stack spacing={3}>
              {related ? (
                related.items.map((article) => (
                  <Box key={article.id} layerStyle="subtleSurface" p={3}>
                    <HStack
                      align="flex-start"
                      justify="space-between"
                      spacing={3}
                    >
                      <Box minW={0}>
                        <Text fontWeight="700" noOfLines={2}>
                          {article.title}
                        </Text>
                        <Text color="ink.500" fontSize="sm">
                          {article.status === 'PUBLISHED' ? '已发布' : '草稿'}
                        </Text>
                      </Box>
                      <AuthButton
                        code="blog:tag:view"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="预览文章"
                        aria-label={`预览文章《${article.title}》`}
                        icon={<LocalIcon icon={EditorPreviewIcon} />}
                        onClick={() => setPreviewing(article)}
                      />
                    </HStack>
                  </Box>
                ))
              ) : (
                <Text color="ink.500">加载中...</Text>
              )}
              {related && !related.items.length ? (
                <Text color="ink.500">暂无关联文章</Text>
              ) : null}
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </AppDrawer>

      <ArticlePreviewModal
        articleUrl={
          previewing && viewing
            ? `/api/v1/blog/manage/tags/${viewing.id}/articles/${previewing.id}`
            : null
        }
        isOpen={Boolean(previewing)}
        onClose={() => setPreviewing(null)}
      />

      <ConfirmDialog
        isOpen={confirm.isOpen}
        title="删除标签"
        description={`确认删除“${deleting?.name || ''}”？该标签将从 ${deleting?.articleCount || 0} 篇文章中解除关联。`}
        error={feedback.error}
        confirmLabel="删除"
        intent="danger"
        isLoading={feedback.loading}
        onClose={confirm.onClose}
        onConfirm={async () => {
          const ok = await feedback.run(
            async () => {
              if (deleting)
                await requestJson(`/api/v1/blog/manage/tags/${deleting.id}`, {
                  method: 'DELETE',
                });
            },
            { successTitle: '标签已删除' },
          );
          if (ok) {
            confirm.onClose();
            await loadList();
          }
        }}
      />
    </>
  );
}
