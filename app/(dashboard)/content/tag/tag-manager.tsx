'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
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
import { FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
} from '@/components/content/admin-types';
import { requestJson } from '@/lib/client-api';

type TagItem = {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function TagManager({ initial }: { initial: PageResult<TagItem> }) {
  const [data, setData] = useState(initial);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [deleting, setDeleting] = useState<TagItem | null>(null);
  const [viewing, setViewing] = useState<TagItem | null>(null);
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
        await requestJson<PageResult<TagItem>>(`/api/admin/tags?${query}`),
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

  function openForm(tag?: TagItem) {
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
          editing ? `/api/admin/tags/${editing.id}` : '/api/admin/tags',
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

  async function openRelated(tag: TagItem) {
    setViewing(tag);
    setRelated(null);
    drawer.onOpen();
    try {
      setRelated(
        await requestJson<PageResult<ArticleListItem>>(
          `/api/admin/tags/${tag.id}/articles?page=1&pageSize=100`,
        ),
      );
    } catch {
      setRelated({ items: [], total: 0, page: 1, pageSize: 100 });
    }
  }

  return (
    <>
      <DataTableCard
        minW="760px"
        title="标签列表"
        meta={`${data.total} 个标签`}
        primaryAction={
          <AuthButton
            code="content:tag:create"
            icon={<Icon as={Plus} boxSize={4} />}
            onClick={() => openForm()}
          >
            新增标签
          </AuthButton>
        }
        toolbar={
          <Stack spacing={3}>
            {listError ? (
              <Alert status="error">
                <AlertIcon />
                <AlertDescription>{listError}</AlertDescription>
              </Alert>
            ) : null}
            <InputGroup maxW="360px">
              <InputLeftElement>
                <Icon as={Search} boxSize={4} color="ink.400" />
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
                        code="content:tag:view"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="查看关联文章"
                        icon={<Icon as={FileText} boxSize={4} />}
                        onClick={() => void openRelated(tag)}
                      />
                      <AuthButton
                        code="content:tag:update"
                        size="xs"
                        intent="neutral"
                        variant="ghost"
                        tooltip="编辑标签"
                        icon={<Icon as={Pencil} boxSize={4} />}
                        onClick={() => openForm(tag)}
                      />
                      <AuthButton
                        code="content:tag:delete"
                        size="xs"
                        intent="danger"
                        variant="ghost"
                        tooltip="删除标签"
                        icon={<Icon as={Trash2} boxSize={4} />}
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

      <Modal isOpen={form.isOpen} onClose={form.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <Box as="form" onSubmit={submit}>
            <ModalHeader>{editing ? '编辑标签' : '新增标签'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                {feedback.error ? (
                  <Alert status="error">
                    <AlertIcon />
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
      </Modal>

      <Drawer
        isOpen={drawer.isOpen}
        placement="right"
        size="md"
        onClose={drawer.onClose}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{viewing?.name} · 关联文章</DrawerHeader>
          <DrawerBody>
            <Stack spacing={3}>
              {related ? (
                related.items.map((article) => (
                  <Box key={article.id} layerStyle="subtleSurface" p={3}>
                    <Text fontWeight="700">{article.title}</Text>
                    <Text color="ink.500" fontSize="sm">
                      {article.status === 'PUBLISHED' ? '已发布' : '草稿'}
                    </Text>
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
      </Drawer>

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
                await requestJson(`/api/admin/tags/${deleting.id}`, {
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
