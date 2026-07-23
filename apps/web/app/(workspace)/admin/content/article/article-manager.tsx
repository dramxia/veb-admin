'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Button,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
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
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { AuthButton } from '@/components/auth/auth-button';
import { Auth } from '@/components/auth/auth';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  DataTableCard,
  EmptyTableRow,
  TableActions,
} from '@/components/common/data-table';
import { PaginationControls } from '@/components/common/pagination-controls';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';
import type {
  ArticleListItem,
  ContentAuthor,
  ContentTag,
  PageResult,
} from '@/components/content/admin-types';

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
  authors: ContentAuthor[];
}) {
  const [data, setData] = useState(initial);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [tagId, setTagId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [deleting, setDeleting] = useState<ArticleListItem | null>(null);
  const dialog = useDisclosure();
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
            `/api/v1/blog/articles?${query}`,
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
  }, [authorId, keyword, page, status, tagId]);

  return (
    <>
      <DataTableCard
        minW="1080px"
        title="文章列表"
        description="草稿不会出现在公开文章页，发布后可通过文章链接访问。"
        meta={`${data.total} 篇文章`}
        primaryAction={
          <Auth code="content:article:create">
            <Button
              as={NextLink}
              href="/admin/content/article/new"
              leftIcon={<Icon as={Plus} boxSize={4} />}
            >
              新增文章
            </Button>
          </Auth>
        }
        toolbar={
          <Stack spacing={3}>
            {fetchError ? (
              <Alert status="error">
                <AlertIcon />
                <AlertDescription>{fetchError}</AlertDescription>
              </Alert>
            ) : null}
            <Stack direction={{ base: 'column', lg: 'row' }} spacing={3}>
              <InputGroup flex="1" minW="240px">
                <InputLeftElement>
                  <Icon as={Search} boxSize={4} color="ink.400" />
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
              <Select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                maxW={{ lg: '160px' }}
              >
                <option value="">全部状态</option>
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">已发布</option>
              </Select>
              <Select
                value={tagId}
                onChange={(event) => {
                  setTagId(event.target.value);
                  setPage(1);
                }}
                maxW={{ lg: '180px' }}
              >
                <option value="">全部标签</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </Select>
              <Select
                value={authorId}
                onChange={(event) => {
                  setAuthorId(event.target.value);
                  setPage(1);
                }}
                maxW={{ lg: '180px' }}
              >
                <option value="">全部作者</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.nickname || author.username}
                  </option>
                ))}
              </Select>
            </Stack>
          </Stack>
        }
      >
        <Table size="sm" aria-busy={fetching}>
          <Thead>
            <Tr>
              <Th>文章</Th>
              <Th>状态</Th>
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
                    <Badge
                      colorScheme={
                        article.status === 'PUBLISHED' ? 'green' : 'gray'
                      }
                    >
                      {article.status === 'PUBLISHED' ? '已发布' : '草稿'}
                    </Badge>
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
                      {article.status === 'PUBLISHED' ? (
                        <Button
                          as={NextLink}
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          size="xs"
                          variant="ghost"
                          aria-label="查看公开文章"
                        >
                          <Icon as={ExternalLink} boxSize={4} />
                        </Button>
                      ) : null}
                      <Auth code="content:article:update">
                        <Button
                          as={NextLink}
                          href={`/admin/content/article/${article.id}/edit`}
                          size="xs"
                          variant="ghost"
                          aria-label="编辑文章"
                        >
                          <Icon as={Pencil} boxSize={4} />
                        </Button>
                      </Auth>
                      <AuthButton
                        code="content:article:delete"
                        size="xs"
                        intent="danger"
                        variant="ghost"
                        tooltip="删除文章"
                        icon={<Icon as={Trash2} boxSize={4} />}
                        onClick={() => {
                          setDeleting(article);
                          dialog.onOpen();
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
      <ConfirmDialog
        isOpen={dialog.isOpen}
        title="删除文章"
        description={`确认删除“${deleting?.title || ''}”？标签关联和喜欢记录也会被删除。`}
        error={feedback.error}
        confirmLabel="删除"
        intent="danger"
        isLoading={feedback.loading}
        onClose={dialog.onClose}
        onConfirm={async () => {
          const ok = await feedback.run(
            async () => {
              if (deleting)
                await requestJson(`/api/v1/blog/articles/${deleting.id}`, {
                  method: 'DELETE',
                });
            },
            { successTitle: '文章已删除' },
          );
          if (ok) {
            dialog.onClose();
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
