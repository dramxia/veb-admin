'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Tooltip,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  Bold,
  Braces,
  Code2,
  Columns2,
  Eye,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  PenLine,
  Quote,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';
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

type ViewMode = 'write' | 'split' | 'preview';
type MarkdownAction =
  | 'bold'
  | 'italic'
  | 'heading'
  | 'quote'
  | 'unordered-list'
  | 'ordered-list'
  | 'code'
  | 'link'
  | 'image';

const formatActions: Array<{
  action: MarkdownAction;
  icon: typeof Bold;
  label: string;
}> = [
  { action: 'heading', icon: Heading2, label: '二级标题' },
  { action: 'bold', icon: Bold, label: '粗体' },
  { action: 'italic', icon: Italic, label: '斜体' },
  { action: 'quote', icon: Quote, label: '引用' },
  { action: 'unordered-list', icon: List, label: '无序列表' },
  { action: 'ordered-list', icon: ListOrdered, label: '有序列表' },
  { action: 'code', icon: Code2, label: '代码' },
  { action: 'link', icon: Link2, label: '链接' },
  { action: 'image', icon: ImageIcon, label: '图片' },
];

const viewModes: Array<{
  value: ViewMode;
  icon: typeof PenLine;
  label: string;
}> = [
  { value: 'write', icon: PenLine, label: '编辑' },
  { value: 'split', icon: Columns2, label: '分栏' },
  { value: 'preview', icon: Eye, label: '预览' },
];

function wrapSelection(
  source: string,
  start: number,
  end: number,
  before: string,
  after: string,
  fallback: string,
) {
  const selection = source.slice(start, end) || fallback;
  return {
    value: `${source.slice(0, start)}${before}${selection}${after}${source.slice(end)}`,
    start: start + before.length,
    end: start + before.length + selection.length,
  };
}

function prefixLines(
  source: string,
  start: number,
  end: number,
  prefix: (index: number) => string,
) {
  const lineStart = source.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const nextBreak = source.indexOf('\n', end);
  const lineEnd = nextBreak === -1 ? source.length : nextBreak;
  const selection = source.slice(lineStart, lineEnd);
  const formatted = selection
    .split('\n')
    .map((line, index) => `${prefix(index)}${line}`)
    .join('\n');
  return {
    value: `${source.slice(0, lineStart)}${formatted}${source.slice(lineEnd)}`,
    start: lineStart,
    end: lineStart + formatted.length,
  };
}

export function ArticleEditor({
  article,
  tags,
}: {
  article?: ArticleDetail | null;
  tags: ContentTag[];
}) {
  const router = useRouter();
  const canPublish = useHasPermission('content:article:publish');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState<EditorState>({
    title: article?.title || '',
    slug: article?.slug || '',
    summary: article?.summary || '',
    contentMarkdown: article?.contentMarkdown || '',
    status: article?.status || 'DRAFT',
    tagIds: article?.tags.map((tag) => tag.id) || [],
  });
  const [viewMode, setViewMode] = useState<ViewMode>('write');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function applyMarkdown(action: MarkdownAction) {
    const editor = editorRef.current;
    if (!editor) return;

    const { selectionStart: start, selectionEnd: end } = editor;
    const source = state.contentMarkdown;
    let result: { value: string; start: number; end: number };

    switch (action) {
      case 'heading':
        result = prefixLines(source, start, end, () => '## ');
        break;
      case 'quote':
        result = prefixLines(source, start, end, () => '> ');
        break;
      case 'unordered-list':
        result = prefixLines(source, start, end, () => '- ');
        break;
      case 'ordered-list':
        result = prefixLines(source, start, end, (index) => `${index + 1}. `);
        break;
      case 'bold':
        result = wrapSelection(source, start, end, '**', '**', '粗体文字');
        break;
      case 'italic':
        result = wrapSelection(source, start, end, '*', '*', '斜体文字');
        break;
      case 'link':
        result = wrapSelection(
          source,
          start,
          end,
          '[',
          '](https://)',
          '链接文字',
        );
        break;
      case 'image':
        result = wrapSelection(
          source,
          start,
          end,
          '![',
          '](https://)',
          '图片说明',
        );
        break;
      case 'code': {
        const selection = source.slice(start, end);
        result = selection.includes('\n')
          ? wrapSelection(source, start, end, '```\n', '\n```', '代码')
          : wrapSelection(source, start, end, '`', '`', '代码');
        break;
      }
    }

    update('contentMarkdown', result.value);
    window.requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(result.start, result.end);
    });
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
      ref={editorRef}
      value={state.contentMarkdown}
      onChange={(event) => update('contentMarkdown', event.target.value)}
      minH={{ base: '480px', lg: '640px' }}
      h="full"
      resize="vertical"
      border={0}
      borderRadius={0}
      bg="white"
      p={{ base: 4, md: 6 }}
      fontFamily="mono"
      fontSize="15px"
      lineHeight="1.85"
      placeholder="# 开始编写 Markdown 正文"
      isDisabled={saving}
      aria-label="Markdown 正文"
      spellCheck={false}
      _hover={{ borderColor: 'transparent' }}
      _focusVisible={{ boxShadow: 'none', borderColor: 'transparent' }}
    />
  );

  const preview = (
    <Box
      minH={{ base: '480px', lg: '640px' }}
      h="full"
      bg="white"
      overflowX="auto"
      px={{ base: 4, md: 6 }}
      py={{ base: 5, md: 8 }}
    >
      <Box maxW="740px" mx="auto">
        {state.contentMarkdown ? (
          <MarkdownContent>{state.contentMarkdown}</MarkdownContent>
        ) : (
          <Flex
            minH={{ base: '420px', lg: '560px' }}
            align="center"
            direction="column"
            justify="center"
            color="ink.400"
            textAlign="center"
          >
            <Icon as={Braces} boxSize={7} mb={3} />
            <Text fontWeight="700">暂无预览内容</Text>
          </Flex>
        )}
      </Box>
    </Box>
  );

  return (
    <Box as="form" onSubmit={submit}>
      <Stack spacing={4}>
        {error ? (
          <Alert status="error" aria-live="polite">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Box layerStyle="glassSolid" p={{ base: 4, md: 6 }}>
          <Flex
            align={{ base: 'stretch', md: 'flex-start' }}
            direction={{ base: 'column', md: 'row' }}
            gap={5}
            justify="space-between"
            mb={5}
          >
            <Box>
              <Heading as="h2" color="ink.900" fontSize="lg">
                文章信息
              </Heading>
              <Text color="ink.500" fontSize="sm" mt={1}>
                完善标题、摘要和发布范围
              </Text>
            </Box>
            <FormControl w={{ base: 'full', md: '180px' }} flexShrink={0}>
              <FormLabel>发布状态</FormLabel>
              <Select
                value={state.status}
                onChange={(event) =>
                  update('status', event.target.value as EditorState['status'])
                }
                isDisabled={saving}
              >
                <option value="DRAFT">草稿</option>
                {canPublish || article?.status === 'PUBLISHED' ? (
                  <option value="PUBLISHED">已发布</option>
                ) : null}
              </Select>
            </FormControl>
          </Flex>

          <Stack spacing={5}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>标题</FormLabel>
                <Input
                  value={state.title}
                  maxLength={120}
                  onChange={(event) => update('title', event.target.value)}
                  placeholder="输入清晰、准确的文章标题"
                  isDisabled={saving}
                />
                <FormHelperText textAlign="right">
                  {state.title.length} / 120
                </FormHelperText>
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
                  创建后保持不变可避免公开链接失效
                </FormHelperText>
              </FormControl>
            </SimpleGrid>

            <FormControl isRequired={state.status === 'PUBLISHED'}>
              <FormLabel>摘要</FormLabel>
              <Textarea
                value={state.summary}
                maxLength={300}
                rows={3}
                resize="vertical"
                onChange={(event) => update('summary', event.target.value)}
                placeholder="概括文章内容，发布后显示在标题下方"
                isDisabled={saving}
              />
              <FormHelperText textAlign="right">
                {state.summary.length} / 300
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>标签</FormLabel>
              {tags.length ? (
                <Wrap spacing={2}>
                  {tags.map((tag) => {
                    const selected = state.tagIds.includes(tag.id);
                    return (
                      <WrapItem key={tag.id}>
                        <Checkbox
                          isChecked={selected}
                          onChange={(event) =>
                            update(
                              'tagIds',
                              event.target.checked
                                ? [...state.tagIds, tag.id]
                                : state.tagIds.filter((id) => id !== tag.id),
                            )
                          }
                          isDisabled={saving}
                          px={3}
                          py={2}
                          borderWidth="1px"
                          borderColor={selected ? 'brand.300' : 'borderDefault'}
                          borderRadius="12px"
                          bg={selected ? 'brand.50' : 'controlBg'}
                          color={selected ? 'brand.700' : 'ink.700'}
                        >
                          {tag.name}
                        </Checkbox>
                      </WrapItem>
                    );
                  })}
                </Wrap>
              ) : (
                <Text color="ink.500" fontSize="sm">
                  暂无标签
                </Text>
              )}
            </FormControl>
          </Stack>
        </Box>

        <Box layerStyle="glassSolid">
          <Flex
            align={{ base: 'stretch', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            gap={3}
            justify="space-between"
            px={{ base: 3, md: 4 }}
            py={3}
          >
            <HStack spacing={1} wrap="wrap">
              {formatActions.map(({ action, icon, label }) => (
                <Tooltip key={action} label={label} hasArrow>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    minW={9}
                    px={2.5}
                    aria-label={label}
                    isDisabled={saving || viewMode === 'preview'}
                    onClick={() => applyMarkdown(action)}
                  >
                    <Icon as={icon} boxSize={4} />
                  </Button>
                </Tooltip>
              ))}
              <Badge ml={2} colorScheme="gray" fontWeight="600">
                {state.contentMarkdown.length} 字符
              </Badge>
            </HStack>

            <ButtonGroup size="sm" isAttached variant="outline" flexShrink={0}>
              {viewModes.map(({ value, icon, label }) => (
                <Button
                  key={value}
                  type="button"
                  leftIcon={<Icon as={icon} boxSize={4} />}
                  colorScheme={viewMode === value ? 'brand' : 'gray'}
                  bg={viewMode === value ? 'brand.50' : 'controlBg'}
                  color={viewMode === value ? 'brand.700' : 'ink.600'}
                  aria-pressed={viewMode === value}
                  onClick={() => setViewMode(value)}
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </Flex>
          <Divider />

          <FormControl isRequired={state.status === 'PUBLISHED'}>
            <FormLabel srOnly>Markdown 正文</FormLabel>
            {viewMode === 'write' ? sourceEditor : null}
            {viewMode === 'preview' ? preview : null}
            {viewMode === 'split' ? (
              <Grid
                templateColumns={{
                  base: '1fr',
                  lg: 'minmax(0, 1fr) minmax(0, 1fr)',
                }}
                sx={{ '& > * + *': { borderLeftWidth: { lg: '1px' } } }}
              >
                {sourceEditor}
                {preview}
              </Grid>
            ) : null}
          </FormControl>
        </Box>

        <HStack
          layerStyle="toolbarSurface"
          justify="space-between"
          p={3}
        >
          <Text
            display={{ base: 'none', md: 'block' }}
            color="ink.500"
            fontSize="sm"
          >
            {state.status === 'PUBLISHED'
              ? '保存后立即更新公开文章'
              : '当前内容仅保存为草稿'}
          </Text>
          <HStack spacing={2} ml="auto">
            <Button
              type="button"
              variant="ghost"
              isDisabled={saving}
              onClick={() => router.push('/content/article')}
            >
              取消
            </Button>
            <Button type="submit" isLoading={saving} loadingText="保存中">
              {article ? '保存修改' : '创建文章'}
            </Button>
          </HStack>
        </HStack>
      </Stack>
    </Box>
  );
}
