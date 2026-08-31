'use client';

import {
  Alert,
  AlertDescription,
  Badge,
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  AddIcon,
  DeleteIcon,
  EditIcon,
  EditorPreviewIcon,
  SearchIcon,
} from '@/assets/icons';
import { AuthButton } from '@/components/auth/auth-button';
import { Auth } from '@/components/auth/auth';
import { useHasPermission } from '@/components/auth/use-has-permission';
import { ArticleMeta } from '@/components/blog/article-meta';
import { MarkdownContent } from '@/components/blog/markdown-content';
import { AppSelect } from '@/components/common/app-select';
import { AlertStatusIcon } from '@/components/common/alert-status-icon';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  DataTableCard,
  EmptyTableRow,
  TableActions,
} from '@/components/common/data-table';
import { PaginationControls } from '@/components/common/pagination-controls';
import { LocalIcon } from '@/components/common/local-icon';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';
import type {
  ArticleDetail,
  ArticleListItem,
  BlogAuthor,
  ContentTag,
  PageResult,
} from '@/components/blog/admin-types';

function dateText(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(
        new Date(value),
      )
    : '-';
}

export function ArticleManager({
  initial,
  tags,
  authors,
}: {
  initial: PageResult<ArticleListItem>;
  tags: ContentTag[];
  authors: BlogAuthor[];
}) {
  const toast = useToast();
  const canUpdate = useHasPermission('blog:article:update');
  const canPublish = useHasPermission('blog:article:publish');
  const [data, setData] = useState(initial);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [tagId, setTagId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [changingStatusIds, setChangingStatusIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [previewing, setPreviewing] = useState<ArticleDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [deleting, setDeleting] = useState<ArticleListItem | null>(null);
  const previewRequestId = useRef(0);
  const previewDialog = useDisclosure();
  const deleteDialog = useDisclosure();
  const feedback = useActionFeedback();

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setFetching(true);
      setFetchError('');
      try {
        const query = new URLSearchParams({
          page: String(page),
          pageSize: '20',
        });
        if (keyword.trim()) query.set('keyword', keyword.trim());
        if (status) query.set('status', status);
        if (tagId) query.set('tagId', tagId);
        if (authorId) query.set('authorId', authorId);
        setData(
          await requestJson<PageResult<ArticleListItem>>(
            `/api/v1/blog/manage/articles?${query}`,
          ),
        );
      } catch (error) {
        setFetchError(
          error instanceof Error ? error.message : '文章列表加载失败',
        );
      } finally {
        setFetching(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [authorId, keyword, page, refreshVersion, status, tagId]);

  async function changeArticleStatus(
    article: ArticleListItem,
    published: boolean,
  ) {
    if (changingStatusIds.has(article.id)) return;

    const nextStatus = published ? 'PUBLISHED' : 'DRAFT';
    setChangingStatusIds((current) => new Set(current).add(article.id));
    try {
      const updated = await requestJson<ArticleDetail>(
        `/api/v1/blog/manage/articles/${article.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      setData((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                status: updated.status,
                publishedAt: updated.publishedAt,
                updatedAt: updated.updatedAt,
              }
            : item,
        ),
      }));
      toast({
        title: published ? '文章已正式发布' : '文章已转为草稿',
        status: 'success',
      });
      setRefreshVersion((current) => current + 1);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : '发布状态更新失败',
        status: 'error',
      });
    } finally {
      setChangingStatusIds((current) => {
        const next = new Set(current);
        next.delete(article.id);
        return next;
      });
    }
  }

  async function openArticlePreview(article: ArticleListItem) {
    const requestId = ++previewRequestId.current;
    setPreviewing(null);
    setPreviewError('');
    setPreviewLoading(true);
    previewDialog.onOpen();

    try {
      const detail = await requestJson<ArticleDetail>(
        `/api/v1/blog/manage/articles/${article.id}`,
      );
      if (previewRequestId.current === requestId) setPreviewing(detail);
    } catch (error) {
      if (previewRequestId.current === requestId) {
        setPreviewError(
          error instanceof Error ? error.message : '文章预览加载失败',
        );
      }
    } finally {
      if (previewRequestId.current === requestId) setPreviewLoading(false);
    }
  }

  function closeArticlePreview() {
    previewRequestId.current += 1;
    previewDialog.onClose();
    setPreviewing(null);
    setPreviewError('');
    setPreviewLoading(false);
  }

  return (
    <>
      <DataTableCard
        minW="1080px"
        title="文章列表"
        description="使用发布开关控制公开状态，草稿也可以在后台预览。"
        meta={`${data.total} 篇文章`}
        primaryAction={
          <Auth code="blog:article:create">
            <Button
              as={NextLink}
              href="/admin/blog/article/new"
              leftIcon={<LocalIcon icon={AddIcon} />}
            >
              新增文章
            </Button>
          </Auth>
        }
        toolbar={
          <Stack spacing={3}>
            {fetchError ? (
              <Alert status="error">
                <AlertStatusIcon status="error" />
                <AlertDescription>{fetchError}</AlertDescription>
              </Alert>
            ) : null}
            <Stack direction={{ base: 'column', lg: 'row' }} spacing={3}>
              <InputGroup flex="1" minW="240px">
                <InputLeftElement>
                  <LocalIcon icon={SearchIcon} color="ink.400" />
                </InputLeftElement>
                <Input
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setPage(1);
                  }}
                  placeholder="搜索标题或摘要"
                  pl={10}
                />
              </InputGroup>
              <AppSelect
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                sx={{ maxW: { lg: '160px' } }}
              >
                <option value="">全部状态</option>
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">已发布</option>
              </AppSelect>
              <AppSelect
                value={tagId}
                onChange={(event) => {
                  setTagId(event.target.value);
                  setPage(1);
                }}
                sx={{ maxW: { lg: '180px' } }}
              >
                <option value="">全部标签</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </AppSelect>
              <AppSelect
                value={authorId}
                onChange={(event) => {
                  setAuthorId(event.target.value);
                  setPage(1);
                }}
                sx={{ maxW: { lg: '180px' } }}
              >
                <option value="">全部作者</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.nickname || author.username}
                  </option>
                ))}
              </AppSelect>
            </Stack>
          </Stack>
        }
      >
        <Table size="sm" aria-busy={fetching}>
          <Thead>
            <Tr>
              <Th>文章</Th>
              <Th>发布</Th>
              <Th>标签</Th>
              <Th>作者</Th>
              <Th>发布日期</Th>
              <Th isNumeric>喜欢</Th>
              <Th isNumeric>评论</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {data.items.length ? (
            <Tbody>
              {data.items.map((article) => (
                <Tr key={article.id}>
                  <Td maxW="320px">
                    <Text fontWeight="700" color="ink.800" noOfLines={1}>
                      {article.title}
                    </Text>
                    <Text color="ink.500" fontSize="xs" noOfLines={1}>
                      /{article.slug}
                    </Text>
                  </Td>
                  <Td>
                    {canUpdate ? (
                      <HStack spacing={2} minW="112px">
                        <Switch
                          colorScheme="brand"
                          size="sm"
                          isChecked={article.status === 'PUBLISHED'}
                          isDisabled={
                            fetching ||
                            changingStatusIds.has(article.id) ||
                            (!canPublish && article.status !== 'PUBLISHED')
                          }
                          onChange={(event) =>
                            void changeArticleStatus(
                              article,
                              event.target.checked,
                            )
                          }
                          aria-label={
                            article.status === 'PUBLISHED'
                              ? `将《${article.title}》撤回为草稿`
                              : `将《${article.title}》正式发布`
                          }
                        />
                        <Text
                          color={
                            article.status === 'PUBLISHED'
                              ? 'statusSuccess'
                              : 'ink.500'
                          }
                          fontSize="xs"
                          fontWeight="700"
                          whiteSpace="nowrap"
                        >
                          {article.status === 'PUBLISHED' ? '已发布' : '草稿'}
                        </Text>
                      </HStack>
                    ) : (
                      <Badge
                        colorScheme={
                          article.status === 'PUBLISHED' ? 'green' : 'gray'
                        }
                      >
                        {article.status === 'PUBLISHED' ? '已发布' : '草稿'}
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={1} wrap="wrap">
                      {article.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} colorScheme="brand">
                          {tag.name}
                        </Badge>
                      ))}
                      {article.tags.length > 3 ? (
                        <Badge>+{article.tags.length - 3}</Badge>
                      ) : null}
                    </HStack>
                  </Td>
                  <Td>
                    {article.author?.nickname ||
                      article.author?.username ||
                      '-'}
                  </Td>
                  <Td>{dateText(article.publishedAt)}</Td>
                  <Td isNumeric>{article.likeCount}</Td>
                  <Td isNumeric>{article.commentCount}</Td>
                  <Td>
                    <TableActions>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        aria-label="预览文章"
                        onClick={() => void openArticlePreview(article)}
                      >
                        <LocalIcon icon={EditorPreviewIcon} />
                      </Button>
                      <Auth code="blog:article:update">
                        <Button
                          as={NextLink}
                          href={`/admin/blog/article/${article.id}/edit`}
                          size="xs"
                          variant="ghost"
                          aria-label="编辑文章"
                        >
                          <LocalIcon icon={EditIcon} />
                        </Button>
                      </Auth>
                      <AuthButton
                        code="blog:article:delete"
                        size="xs"
                        intent="danger"
                        variant="ghost"
                        tooltip="删除文章"
                        icon={<LocalIcon icon={DeleteIcon} />}
                        onClick={() => {
                          setDeleting(article);
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
              text="暂无文章"
              description="新增文章或调整筛选条件。"
            />
          )}
        </Table>
        <PaginationControls
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          disabled={fetching}
          onPageChange={setPage}
        />
      </DataTableCard>
      <Modal
        isOpen={previewDialog.isOpen}
        onClose={closeArticlePreview}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent
          h={{ base: '100dvh', md: 'calc(100dvh - 48px)' }}
          maxH={{ base: '100dvh', md: 'calc(100dvh - 48px)' }}
          my={{ base: 0, md: 6 }}
        >
          <ModalHeader flexShrink={0}>文章预览</ModalHeader>
          <ModalCloseButton />
          <ModalBody
            flex="1 1 auto"
            minH={0}
            overflowY="auto"
            overscrollBehavior="contain"
            pb={8}
            sx={{ scrollbarGutter: 'stable' }}
          >
            {previewLoading ? (
              <Stack align="center" justify="center" minH="320px" spacing={3}>
                <Spinner color="brand.500" />
                <Text color="ink.500" fontSize="sm">
                  正在加载文章内容
                </Text>
              </Stack>
            ) : previewError ? (
              <Alert status="error">
                <AlertStatusIcon status="error" />
                <AlertDescription>{previewError}</AlertDescription>
              </Alert>
            ) : previewing ? (
              <Box as="article" maxW="780px" mx="auto">
                <HStack spacing={2} mb={4} wrap="wrap">
                  <Badge
                    colorScheme={
                      previewing.status === 'PUBLISHED' ? 'green' : 'gray'
                    }
                  >
                    {previewing.status === 'PUBLISHED' ? '已发布' : '草稿'}
                  </Badge>
                  <Text color="ink.500" fontSize="sm">
                    /{previewing.slug}
                  </Text>
                </HStack>
                <Heading
                  as="h2"
                  color="ink.900"
                  fontSize={{ base: '2xl', md: '36px' }}
                  lineHeight="1.3"
                >
                  {previewing.title}
                </Heading>
                {previewing.summary ? (
                  <Text color="ink.600" fontSize="lg" lineHeight="1.75" mt={4}>
                    {previewing.summary}
                  </Text>
                ) : null}
                {previewing.tags.length ? (
                  <HStack spacing={2} mt={4} wrap="wrap">
                    {previewing.tags.map((tag) => (
                      <Badge key={tag.id} colorScheme="brand">
                        {tag.name}
                      </Badge>
                    ))}
                  </HStack>
                ) : null}
                <Box mt={4}>
                  <ArticleMeta
                    publishedAt={previewing.publishedAt}
                    likeCount={previewing.likeCount}
                    commentCount={previewing.commentCount}
                  />
                </Box>
                <Divider my={{ base: 6, md: 8 }} />
                {previewing.contentMarkdown ? (
                  <MarkdownContent>
                    {previewing.contentMarkdown}
                  </MarkdownContent>
                ) : (
                  <Stack py={12} textAlign="center" spacing={1}>
                    <Text color="ink.700" fontWeight="700">
                      暂无正文内容
                    </Text>
                    <Text color="ink.500" fontSize="sm">
                      可进入编辑页补充 Markdown 正文。
                    </Text>
                  </Stack>
                )}
              </Box>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="删除文章"
        description={`确认删除“${deleting?.title || ''}”？标签关联和喜欢记录也会被删除。`}
        error={feedback.error}
        confirmLabel="删除"
        intent="danger"
        isLoading={feedback.loading}
        onClose={deleteDialog.onClose}
        onConfirm={async () => {
          const ok = await feedback.run(
            async () => {
              if (deleting)
                await requestJson(
                  `/api/v1/blog/manage/articles/${deleting.id}`,
                  {
                    method: 'DELETE',
                  },
                );
            },
            { successTitle: '文章已删除' },
          );
          if (ok) {
            deleteDialog.onClose();
            setPage(1);
            setData((current) => ({
              ...current,
              items: current.items.filter((item) => item.id !== deleting?.id),
              total: Math.max(0, current.total - 1),
            }));
          }
        }}
      />
    </>
  );
}
