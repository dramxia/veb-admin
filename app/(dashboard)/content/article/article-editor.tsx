'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Textarea,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { useHasPermission } from '@/components/auth/use-has-permission';
import { MarkdownContent } from '@/components/content/markdown-content';
import type {
  ArticleDetail,
  ContentTag,
} from '@/components/content/admin-types';
import { requestJson } from '@/lib/client-api';

type EditorState = {
  title: string;
  slug: string;
  summary: string;
  contentMarkdown: string;
  status: 'DRAFT' | 'PUBLISHED';
  tagIds: string[];
};

export function ArticleEditor({
  article,
  tags,
}: {
  article?: ArticleDetail | null;
  tags: ContentTag[];
}) {
  const router = useRouter();
  const canPublish = useHasPermission('content:article:publish');
  const [state, setState] = useState<EditorState>({
    title: article?.title || '',
    slug: article?.slug || '',
    summary: article?.summary || '',
    contentMarkdown: article?.contentMarkdown || '',
    status: article?.status || 'DRAFT',
    tagIds: article?.tags.map((tag) => tag.id) || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await requestJson(
        article ? `/api/admin/articles/${article.id}` : '/api/admin/articles',
        {
          method: article ? 'PATCH' : 'POST',
          body: JSON.stringify({ ...state, summary: state.summary || null }),
        },
      );
      router.push('/content/article');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '文章保存失败');
    } finally {
      setSaving(false);
    }
  }

  const sourceEditor = (
    <Textarea
      value={state.contentMarkdown}
      onChange={(event) => update('contentMarkdown', event.target.value)}
      minH={{ base: '440px', lg: '620px' }}
      resize="vertical"
      fontFamily="mono"
      fontSize="sm"
      lineHeight="1.7"
      placeholder="# 开始编写 Markdown 正文"
      isDisabled={saving}
      aria-label="Markdown 正文"
    />
  );
  const preview = (
    <Box
      layerStyle="subtleSurface"
      minH={{ base: '440px', lg: '620px' }}
      p={{ base: 4, md: 6 }}
      overflowX="auto"
    >
      {state.contentMarkdown ? (
        <MarkdownContent>{state.contentMarkdown}</MarkdownContent>
      ) : (
        <Box color="ink.400">暂无预览内容</Box>
      )}
    </Box>
  );

  return (
    <Box as="form" onSubmit={submit}>
      <Stack spacing={5}>
        {error ? (
          <Alert status="error" aria-live="polite">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Box layerStyle="glassSolid" p={{ base: 4, md: 6 }}>
          <Stack spacing={5}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>标题</FormLabel>
                <Input
                  value={state.title}
                  maxLength={120}
                  onChange={(event) => update('title', event.target.value)}
                  isDisabled={saving}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Slug</FormLabel>
                <Input
                  value={state.slug}
                  maxLength={120}
                  onChange={(event) => update('slug', event.target.value)}
                  placeholder="留空时自动生成"
                  isDisabled={saving}
                />
                <FormHelperText>
                  创建后保持不变可避免公开链接失效。
                </FormHelperText>
              </FormControl>
            </SimpleGrid>
            <FormControl isRequired={state.status === 'PUBLISHED'}>
              <FormLabel>摘要</FormLabel>
              <Textarea
                value={state.summary}
                maxLength={300}
                rows={3}
                onChange={(event) => update('summary', event.target.value)}
                isDisabled={saving}
              />
              <FormHelperText>{state.summary.length} / 300</FormHelperText>
            </FormControl>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>状态</FormLabel>
                <Select
                  value={state.status}
                  onChange={(event) =>
                    update(
                      'status',
                      event.target.value as EditorState['status'],
                    )
                  }
                  isDisabled={saving}
                >
                  <option value="DRAFT">草稿</option>
                  {canPublish || article?.status === 'PUBLISHED' ? (
                    <option value="PUBLISHED">已发布</option>
                  ) : null}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>标签</FormLabel>
                <SimpleGrid
                  columns={{ base: 2, md: 3 }}
                  spacing={2}
                  layerStyle="subtleSurface"
                  p={3}
                  maxH="160px"
                  overflowY="auto"
                >
                  {tags.length ? (
                    tags.map((tag) => (
                      <Checkbox
                        key={tag.id}
                        isChecked={state.tagIds.includes(tag.id)}
                        onChange={(event) =>
                          update(
                            'tagIds',
                            event.target.checked
                              ? [...state.tagIds, tag.id]
                              : state.tagIds.filter((id) => id !== tag.id),
                          )
                        }
                        isDisabled={saving}
                      >
                        {tag.name}
                      </Checkbox>
                    ))
                  ) : (
                    <Box color="ink.500" fontSize="sm">
                      暂无标签
                    </Box>
                  )}
                </SimpleGrid>
              </FormControl>
            </SimpleGrid>
          </Stack>
        </Box>

        <Box layerStyle="glassSolid" p={{ base: 4, md: 6 }}>
          <FormControl isRequired={state.status === 'PUBLISHED'}>
            <FormLabel>Markdown 正文</FormLabel>
            <Box display={{ base: 'block', lg: 'none' }}>
              <Tabs variant="softRounded">
                <TabList mb={3}>
                  <Tab>编辑</Tab>
                  <Tab>预览</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel p={0}>{sourceEditor}</TabPanel>
                  <TabPanel p={0}>{preview}</TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
            <Grid
              display={{ base: 'none', lg: 'grid' }}
              templateColumns="minmax(0, 1fr) minmax(0, 1fr)"
              gap={4}
            >
              {sourceEditor}
              {preview}
            </Grid>
          </FormControl>
        </Box>

        <HStack
          position="sticky"
          bottom={4}
          zIndex={5}
          layerStyle="toolbarSurface"
          justify="flex-end"
          p={3}
        >
          <Button
            type="button"
            variant="ghost"
            isDisabled={saving}
            onClick={() => router.push('/content/article')}
          >
            取消
          </Button>
          <Button type="submit" isLoading={saving} loadingText="保存中">
            保存文章
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
}
