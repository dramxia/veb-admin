'use client';

import {
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
  Input,
  Stack,
  Text,
  Textarea,
  Tooltip,
  useDisclosure,
  useToast,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';
import {
  EditorBoldIcon,
  EditorBulletedListIcon,
  EditorCodeBlockIcon,
  EditorCodeDocumentIcon,
  EditorHeadingIcon,
  EditorImageIcon,
  EditorItalicIcon,
  EditorLinkIcon,
  EditorOrderedListIcon,
  EditorPreviewIcon,
  EditorQuoteIcon,
  EditorSplitViewIcon,
  EditorWriteIcon,
  UploadIcon,
} from '@/assets/icons';
import { useHasPermission } from '@/components/auth/use-has-permission';
import { AppSelect } from '@/components/common/app-select';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { LocalIcon, type SvgComponent } from '@/components/common/local-icon';
import { MarkdownContent } from '@/components/blog/markdown-content';
import type { ArticleDetail, ContentTag } from '@/components/blog/admin-types';
import { requestJson } from '@/lib/client-api';
import {
  getMarkdownImportError,
  readMarkdownImportFile,
} from '@/lib/markdown-import';
import { synchronizedScrollTop } from '@/lib/scroll-sync';

type EditorState = {
  title: string;
  summary: string;
  contentMarkdown: string;
  status: 'DRAFT' | 'PUBLISHED';
  tagIds: string[];
};

type ViewMode = 'write' | 'split' | 'preview';
type MobileSection = 'content' | 'details';
type ScrollPane = 'source' | 'preview';
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
  icon: SvgComponent;
  label: string;
}> = [
  { action: 'heading', icon: EditorHeadingIcon, label: '二级标题' },
  { action: 'bold', icon: EditorBoldIcon, label: '粗体' },
  { action: 'italic', icon: EditorItalicIcon, label: '斜体' },
  { action: 'quote', icon: EditorQuoteIcon, label: '引用' },
  { action: 'unordered-list', icon: EditorBulletedListIcon, label: '无序列表' },
  { action: 'ordered-list', icon: EditorOrderedListIcon, label: '有序列表' },
  { action: 'code', icon: EditorCodeBlockIcon, label: '代码' },
  { action: 'link', icon: EditorLinkIcon, label: '链接' },
  { action: 'image', icon: EditorImageIcon, label: '图片' },
];

const viewModes: Array<{
  value: ViewMode;
  icon: SvgComponent;
  label: string;
}> = [
  { value: 'write', icon: EditorWriteIcon, label: '编辑' },
  { value: 'split', icon: EditorSplitViewIcon, label: '分栏' },
  { value: 'preview', icon: EditorPreviewIcon, label: '预览' },
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
  const toast = useToast();
  const canPublish = useHasPermission('blog:article:publish');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const markdownInputRef = useRef<HTMLInputElement>(null);
  const ignoredScrollRef = useRef<{
    pane: ScrollPane;
    scrollTop: number;
  } | null>(null);
  const importDialog = useDisclosure();
  const [state, setState] = useState<EditorState>({
    title: article?.title || '',
    summary: article?.summary || '',
    contentMarkdown: article?.contentMarkdown || '',
    status: article?.status || 'DRAFT',
    tagIds: article?.tags.map((tag) => tag.id) || [],
  });
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [mobileSection, setMobileSection] = useState<MobileSection>('content');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<File | null>(null);

  function update<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function synchronizeEditorScroll(origin: ScrollPane) {
    const source = origin === 'source' ? editorRef.current : previewRef.current;
    const target = origin === 'source' ? previewRef.current : editorRef.current;
    const targetPane: ScrollPane = origin === 'source' ? 'preview' : 'source';
    if (!source || !target) return;

    const ignoredScroll = ignoredScrollRef.current;
    if (
      ignoredScroll?.pane === origin &&
      Math.abs(source.scrollTop - ignoredScroll.scrollTop) <= 1
    ) {
      ignoredScrollRef.current = null;
      return;
    }

    const targetScrollTop = synchronizedScrollTop(source, target);
    if (Math.abs(target.scrollTop - targetScrollTop) <= 1) return;

    ignoredScrollRef.current = { pane: targetPane, scrollTop: targetScrollTop };
    target.scrollTop = targetScrollTop;
  }

  function selectViewMode(value: ViewMode) {
    setViewMode(value);
    if (value === 'split') {
      window.requestAnimationFrame(() => synchronizeEditorScroll('source'));
    }
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

  function resetMarkdownInput() {
    if (markdownInputRef.current) markdownInputRef.current.value = '';
  }

  function closeImportDialog() {
    if (importing) return;
    importDialog.onClose();
    setPendingImport(null);
    resetMarkdownInput();
  }

  async function importMarkdown(file: File) {
    setImporting(true);
    try {
      const imported = await readMarkdownImportFile(file);
      setState((current) => ({
        ...current,
        contentMarkdown: imported.contentMarkdown,
        title: imported.title,
      }));
      selectViewMode('split');
      setMobileSection('content');
      toast({
        title: 'Markdown 已导入',
        description: '已使用文件名填充标题',
        status: 'success',
        duration: 2600,
      });
      importDialog.onClose();
      window.requestAnimationFrame(() => editorRef.current?.focus());
    } catch (cause) {
      toast({
        title: cause instanceof Error ? cause.message : 'Markdown 文件导入失败',
        status: 'error',
      });
    } finally {
      setImporting(false);
      setPendingImport(null);
      resetMarkdownInput();
    }
  }

  function chooseMarkdownFile(file: File | null) {
    if (!file) return;

    const importError = getMarkdownImportError(file);
    if (importError) {
      toast({ title: importError, status: 'error' });
      resetMarkdownInput();
      return;
    }

    if (state.contentMarkdown) {
      setPendingImport(file);
      importDialog.onOpen();
      return;
    }
    void importMarkdown(file);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving || importing) return;
    setSaving(true);
    try {
      await requestJson(
        article
          ? `/api/v1/blog/manage/articles/${article.id}`
          : '/api/v1/blog/manage/articles',
        {
          method: article ? 'PATCH' : 'POST',
          body: JSON.stringify({ ...state, summary: state.summary || null }),
        },
      );
      router.push('/admin/blog/article');
      router.refresh();
    } catch (cause) {
      toast({
        title: cause instanceof Error ? cause.message : '文章保存失败',
        status: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  const sourceEditor = (
    <Textarea
      ref={editorRef}
      value={state.contentMarkdown}
      onChange={(event) => update('contentMarkdown', event.target.value)}
      onScroll={() => synchronizeEditorScroll('source')}
      h="full"
      minH={0}
      resize="none"
      overflowY="auto"
      overscrollBehavior="contain"
      border={0}
      borderRadius={0}
      bg="white"
      p={{ base: 4, md: 5 }}
      fontFamily="mono"
      fontSize="15px"
      lineHeight="1.85"
      placeholder="# 开始编写 Markdown 正文"
      isDisabled={saving || importing}
      aria-label="Markdown 正文"
      spellCheck={false}
      _hover={{ borderColor: 'transparent' }}
      _focusVisible={{ boxShadow: 'none', borderColor: 'transparent' }}
    />
  );

  const preview = (
    <Box
      ref={previewRef}
      h="full"
      minH={0}
      overflowX="auto"
      overflowY="auto"
      overscrollBehavior="contain"
      px={{ base: 4, md: 5 }}
      py={{ base: 4, md: 5 }}
      role="region"
      aria-label="Markdown 预览"
      onScroll={() => synchronizeEditorScroll('preview')}
    >
      <Box maxW="780px" mx="auto">
        {state.contentMarkdown ? (
          <MarkdownContent variant="compact">
            {state.contentMarkdown}
          </MarkdownContent>
        ) : (
          <Flex
            minH="240px"
            h="full"
            align="center"
            direction="column"
            justify="center"
            color="ink.400"
            textAlign="center"
          >
            <LocalIcon icon={EditorCodeDocumentIcon} mb={3} />
            <Text fontWeight="700">暂无预览内容</Text>
          </Flex>
        )}
      </Box>
    </Box>
  );

  const articleDetails = (
    <Stack spacing={5}>
      <Box>
        <Heading as="h2" color="ink.900" fontSize="md">
          文章信息
        </Heading>
        <Text color="ink.500" fontSize="sm" mt={1}>
          设置标题、摘要、标签和发布范围
        </Text>
      </Box>

      <FormControl>
        <FormLabel>发布状态</FormLabel>
        <AppSelect
          value={state.status}
          onChange={(event) =>
            update('status', event.target.value as EditorState['status'])
          }
          isDisabled={saving || importing}
        >
          <option value="DRAFT">草稿</option>
          {canPublish || article?.status === 'PUBLISHED' ? (
            <option value="PUBLISHED">已发布</option>
          ) : null}
        </AppSelect>
        <FormHelperText>
          {state.status === 'PUBLISHED'
            ? '保存后立即更新公开文章'
            : '当前内容仅保存为草稿'}
        </FormHelperText>
      </FormControl>

      <FormControl isRequired>
        <FormLabel>标题</FormLabel>
        <Input
          value={state.title}
          maxLength={120}
          onChange={(event) => update('title', event.target.value)}
          placeholder="输入清晰、准确的文章标题"
          isDisabled={saving || importing}
        />
        <FormHelperText textAlign="right">
          {state.title.length} / 120
        </FormHelperText>
      </FormControl>

      <FormControl isRequired={state.status === 'PUBLISHED'}>
        <FormLabel>摘要</FormLabel>
        <Textarea
          value={state.summary}
          maxLength={300}
          rows={4}
          resize="vertical"
          onChange={(event) => update('summary', event.target.value)}
          placeholder="概括文章内容，发布后显示在标题下方"
          isDisabled={saving || importing}
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
                    isDisabled={saving || importing}
                    px={3}
                    py={2}
                    borderWidth="1px"
                    borderColor={selected ? 'brand.300' : 'borderDefault'}
                    borderRadius="control"
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
  );

  return (
    <Box
      as="form"
      onSubmit={submit}
      h="full"
      minH={0}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Flex
        layerStyle="toolbarSurface"
        align="center"
        justify="space-between"
        gap={3}
        px={{ base: 2, md: 3 }}
        py={2}
        flexShrink={0}
      >
        <HStack spacing={2} minW={0}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            isDisabled={saving || importing}
            onClick={() => router.push('/admin/blog/article')}
          >
            返回
          </Button>
          <Badge
            colorScheme={state.status === 'PUBLISHED' ? 'green' : 'gray'}
            flexShrink={0}
          >
            {state.status === 'PUBLISHED' ? '已发布' : '草稿'}
          </Badge>
          <Text
            display={{ base: 'none', md: 'block' }}
            color="ink.600"
            fontSize="sm"
            fontWeight="600"
            noOfLines={1}
          >
            {state.title.trim() || '未命名文章'}
          </Text>
        </HStack>

        <HStack spacing={2} flexShrink={0}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            display={{ base: 'inline-flex', xl: 'none' }}
            isDisabled={saving || importing}
            onClick={() =>
              setMobileSection((current) =>
                current === 'details' ? 'content' : 'details',
              )
            }
          >
            {mobileSection === 'details' ? '编辑正文' : '文章信息'}
          </Button>
          <Button
            type="submit"
            size="sm"
            isDisabled={importing}
            isLoading={saving}
            loadingText="保存中"
          >
            {article ? '保存修改' : '创建文章'}
          </Button>
        </HStack>
      </Flex>

      <Grid
        flex={1}
        minH={0}
        mt={3}
        gap={3}
        overflow="hidden"
        templateRows="minmax(0, 1fr)"
        templateColumns={{
          base: 'minmax(0, 1fr)',
          xl: 'minmax(260px, 300px) minmax(0, 1fr)',
        }}
      >
        <Box
          as="aside"
          display={{
            base: mobileSection === 'details' ? 'block' : 'none',
            xl: 'block',
          }}
          h="full"
          minH={0}
          overflowY="auto"
          overscrollBehavior="contain"
          layerStyle="glassSolid"
          p={{ base: 4, md: 5 }}
          aria-label="文章信息"
          sx={{ scrollbarGutter: 'stable' }}
        >
          {articleDetails}
        </Box>

        <Flex
          display={{
            base: mobileSection === 'content' ? 'flex' : 'none',
            xl: 'flex',
          }}
          direction="column"
          h="full"
          minH={0}
          minW={0}
          overflow="hidden"
          layerStyle="glassSolid"
        >
          <Flex
            align="center"
            gap={2}
            minW={0}
            px={{ base: 2, md: 3 }}
            py={2}
            flexShrink={0}
            overflow="hidden"
          >
            <HStack
              role="toolbar"
              aria-label="Markdown 格式"
              spacing={1}
              flex={1}
              minW={0}
              overflowX="auto"
              py={1}
              sx={{
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {formatActions.map(({ action, icon, label }) => (
                <Tooltip key={action} label={label} hasArrow>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    minW={9}
                    px={2.5}
                    aria-label={label}
                    isDisabled={saving || importing || viewMode === 'preview'}
                    onClick={() => applyMarkdown(action)}
                  >
                    <LocalIcon icon={icon} />
                  </Button>
                </Tooltip>
              ))}
              <Badge ml={2} colorScheme="gray" fontWeight="600" flexShrink={0}>
                {state.contentMarkdown.length} 字符
              </Badge>
            </HStack>

            <HStack spacing={1} flexShrink={0}>
              <Tooltip label="导入 Markdown 文件" hasArrow>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  px={{ base: 2, md: 3 }}
                  aria-label="导入 Markdown 文件"
                  isDisabled={saving || importing}
                  isLoading={importing}
                  onClick={() => markdownInputRef.current?.click()}
                >
                  <LocalIcon icon={UploadIcon} />
                  <Text
                    as="span"
                    display={{ base: 'none', md: 'inline' }}
                    ml={2}
                  >
                    导入 MD
                  </Text>
                </Button>
              </Tooltip>
              <Input
                ref={markdownInputRef}
                type="file"
                accept=".md,text/markdown"
                display="none"
                isDisabled={saving || importing}
                aria-label="选择 Markdown 文件"
                onChange={(event) =>
                  chooseMarkdownFile(event.target.files?.[0] || null)
                }
              />

              <ButtonGroup
                size="sm"
                isAttached
                variant="outline"
                flexShrink={0}
              >
                {viewModes.map(({ value, icon, label }) => (
                  <Button
                    key={value}
                    type="button"
                    display={
                      value === 'split'
                        ? { base: 'none', lg: 'inline-flex' }
                        : undefined
                    }
                    leftIcon={<LocalIcon icon={icon} />}
                    colorScheme={viewMode === value ? 'brand' : 'gray'}
                    bg={viewMode === value ? 'brand.50' : 'controlBg'}
                    color={viewMode === value ? 'brand.700' : 'ink.600'}
                    aria-pressed={viewMode === value}
                    isDisabled={importing}
                    onClick={() => selectViewMode(value)}
                  >
                    {label}
                  </Button>
                ))}
              </ButtonGroup>
            </HStack>
          </Flex>
          <Divider />

          <FormControl
            isRequired={state.status === 'PUBLISHED'}
            flex={1}
            minH={0}
            display="flex"
            justifyContent={viewMode === 'preview' ? 'center' : 'stretch'}
            overflow="hidden"
          >
            <FormLabel srOnly>Markdown 正文</FormLabel>
            {viewMode === 'write' ? sourceEditor : null}
            {viewMode === 'preview' ? preview : null}
            {viewMode === 'split' ? (
              <Grid
                h="full"
                minH={0}
                w="full"
                overflow="hidden"
                templateColumns={{
                  base: 'minmax(0, 1fr)',
                  lg: 'minmax(0, 1fr) minmax(0, 1fr)',
                }}
                templateRows={{
                  base: 'minmax(0, 1fr) minmax(0, 1fr)',
                  lg: 'minmax(0, 1fr)',
                }}
                sx={{
                  '& > * + *': {
                    borderTopWidth: { base: '1px', lg: 0 },
                    borderLeftWidth: { base: 0, lg: '1px' },
                    borderColor: 'borderDefault',
                  },
                }}
              >
                {sourceEditor}
                {preview}
              </Grid>
            ) : null}
          </FormControl>
        </Flex>
      </Grid>

      <ConfirmDialog
        isOpen={importDialog.isOpen && Boolean(pendingImport)}
        title="替换当前正文？"
        description={
          <Text>
            导入{' '}
            <Text as="span" fontWeight="700">
              {pendingImport?.name}
            </Text>{' '}
            后，当前 Markdown 正文将被替换。文章信息不会改变。
          </Text>
        }
        confirmLabel="替换并导入"
        isLoading={importing}
        onClose={closeImportDialog}
        onConfirm={() => {
          if (pendingImport) return importMarkdown(pendingImport);
        }}
      />
    </Box>
  );
}
