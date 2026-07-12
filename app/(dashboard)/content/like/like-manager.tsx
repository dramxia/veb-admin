'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Checkbox,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
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
import { BarChart3, Heart, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  DataTableCard,
  EmptyTableRow,
  TableActions,
} from '@/components/common/data-table';
import { MetricIsland } from '@/components/common/metric-island';
import { PaginationControls } from '@/components/common/pagination-controls';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import type { PageResult } from '@/components/content/admin-types';
import { requestJson } from '@/lib/client-api';

type LikeItem = {
  id: string;
  articleId: string;
  visitorHashMasked: string;
  createdAt: string | Date;
  article: { title: string; slug: string };
};
type LikeStats = {
  total: number;
  articles: { articleId: string; title?: string; count: number }[];
  trend: { date: string; count: number }[];
};

export function LikeManager({
  initial,
  articles,
}: {
  initial: PageResult<LikeItem>;
  articles: { id: string; title: string }[];
}) {
  const [data, setData] = useState(initial);
  const [stats, setStats] = useState<LikeStats>({
    total: initial.total,
    articles: [],
    trend: [],
  });
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [articleId, setArticleId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<LikeItem | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const confirm = useDisclosure();
  const feedback = useActionFeedback();

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (articleId) params.set('articleId', articleId);
    if (from) params.set('from', `${from}T00:00:00`);
    if (to) params.set('to', `${to}T23:59:59`);
    return params.toString();
  }, [articleId, from, keyword, page, to]);

  const load = useCallback(async () => {
    setFetching(true);
    setFetchError('');
    try {
      const statsQuery = new URLSearchParams(queryString);
      statsQuery.delete('page');
      statsQuery.delete('pageSize');
      statsQuery.delete('keyword');
      const [nextData, nextStats] = await Promise.all([
        requestJson<PageResult<LikeItem>>(`/api/admin/likes?${queryString}`),
        requestJson<LikeStats>(`/api/admin/likes/stats?${statsQuery}`),
      ]);
      setData(nextData);
      setStats(nextStats);
      setSelected([]);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : '喜欢记录加载失败',
      );
    } finally {
      setFetching(false);
    }
  }, [queryString]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  function resetPage() {
    setPage(1);
  }
  function askDelete(item: LikeItem) {
    setDeleting(item);
    setBatchMode(false);
    confirm.onOpen();
  }
  function askBatchDelete() {
    setDeleting(null);
    setBatchMode(true);
    confirm.onOpen();
  }

  async function confirmDelete() {
    const ok = await feedback.run(
      async () => {
        if (batchMode)
          await requestJson('/api/admin/likes/batch-delete', {
            method: 'POST',
            body: JSON.stringify({ ids: selected }),
          });
        else if (deleting)
          await requestJson(`/api/admin/likes/${deleting.id}`, {
            method: 'DELETE',
          });
      },
      { successTitle: batchMode ? '喜欢记录已批量删除' : '喜欢记录已删除' },
    );
    if (ok) {
      confirm.onClose();
      await load();
    }
  }

  return (
    <Stack spacing={5}>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <MetricIsland
          icon={<Heart size={20} />}
          label="筛选范围喜欢数"
          value={stats.total}
          help="默认统计最近 30 天"
          tone="brand"
        />
        <MetricIsland
          icon={<BarChart3 size={20} />}
          label="涉及文章"
          value={stats.articles.length}
          help="当前时间范围内"
          tone="cyan"
        />
        <MetricIsland
          icon={<BarChart3 size={20} />}
          label="活跃天数"
          value={stats.trend.length}
          help="产生喜欢记录的日期"
          tone="green"
        />
      </SimpleGrid>
      <DataTableCard
        minW="900px"
        title="喜欢明细"
        meta={`${data.total} 条记录`}
        primaryAction={
          <AuthButton
            code="content:like:delete"
            intent="danger"
            icon={<Icon as={Trash2} boxSize={4} />}
            isDisabled={!selected.length}
            onClick={askBatchDelete}
          >
            删除选中 ({selected.length})
          </AuthButton>
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
              <InputGroup flex="1" minW="230px">
                <InputLeftElement>
                  <Icon as={Search} boxSize={4} color="ink.400" />
                </InputLeftElement>
                <Input
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    resetPage();
                  }}
                  placeholder="搜索文章或访客哈希"
                  pl={10}
                />
              </InputGroup>
              <Select
                value={articleId}
                onChange={(event) => {
                  setArticleId(event.target.value);
                  resetPage();
                }}
                maxW={{ lg: '220px' }}
              >
                <option value="">全部文章</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.title}
                  </option>
                ))}
              </Select>
              <Input
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  resetPage();
                }}
                maxW={{ lg: '170px' }}
                aria-label="开始日期"
              />
              <Input
                type="date"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  resetPage();
                }}
                maxW={{ lg: '170px' }}
                aria-label="结束日期"
              />
            </Stack>
          </Stack>
        }
      >
        <Table size="sm" aria-busy={fetching}>
          <Thead>
            <Tr>
              <Th w="52px">
                <Checkbox
                  aria-label="选择当前页全部记录"
                  isChecked={
                    Boolean(data.items.length) &&
                    data.items.every((item) => selected.includes(item.id))
                  }
                  isIndeterminate={
                    selected.length > 0 &&
                    !data.items.every((item) => selected.includes(item.id))
                  }
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? data.items.map((item) => item.id)
                        : [],
                    )
                  }
                />
              </Th>
              <Th>文章</Th>
              <Th>访客标识</Th>
              <Th>喜欢时间</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {data.items.length ? (
            <Tbody>
              {data.items.map((item) => (
                <Tr key={item.id} aria-selected={selected.includes(item.id)}>
                  <Td>
                    <Checkbox
                      aria-label={`选择 ${item.article.title} 的喜欢记录`}
                      isChecked={selected.includes(item.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, item.id]
                            : current.filter((id) => id !== item.id),
                        )
                      }
                    />
                  </Td>
                  <Td fontWeight="700" maxW="340px">
                    <Text noOfLines={1}>{item.article.title}</Text>
                  </Td>
                  <Td fontFamily="mono" color="ink.500">
                    {item.visitorHashMasked}
                  </Td>
                  <Td>
                    {new Intl.DateTimeFormat('zh-CN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(item.createdAt))}
                  </Td>
                  <Td>
                    <TableActions>
                      <AuthButton
                        code="content:like:delete"
                        size="xs"
                        intent="danger"
                        variant="ghost"
                        tooltip="删除喜欢记录"
                        icon={<Icon as={Trash2} boxSize={4} />}
                        onClick={() => askDelete(item)}
                      />
                    </TableActions>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          ) : (
            <EmptyTableRow
              colSpan={5}
              text="暂无喜欢记录"
              description="请调整筛选条件或等待公开文章产生互动。"
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
        isOpen={confirm.isOpen}
        title={batchMode ? '批量删除喜欢记录' : '删除喜欢记录'}
        description={
          batchMode
            ? `确认删除选中的 ${selected.length} 条喜欢记录？`
            : `确认删除“${deleting?.article.title || ''}”的这条喜欢记录？`
        }
        error={feedback.error}
        confirmLabel="删除"
        intent="danger"
        isLoading={feedback.loading}
        onClose={confirm.onClose}
        onConfirm={confirmDelete}
      />
    </Stack>
  );
}
