import { describe, expect, it } from 'vitest';
import {
  articleTitleFromFileName,
  getMarkdownImportError,
  MAX_MARKDOWN_CHARACTERS,
  prepareMarkdownImport,
  readMarkdownImportFile,
} from '@/lib/markdown-import';

describe('Markdown file import', () => {
  it('accepts .md file names case-insensitively', () => {
    expect(
      getMarkdownImportError({ name: 'article.md', size: 1024 }),
    ).toBeNull();
    expect(
      getMarkdownImportError({ name: 'ARTICLE.MD', size: 1024 }),
    ).toBeNull();
  });

  it('rejects unsupported extensions and oversized files', () => {
    expect(getMarkdownImportError({ name: 'article.txt', size: 1024 })).toBe(
      '请选择 .md 格式的 Markdown 文件',
    );
    expect(
      getMarkdownImportError({
        name: 'article.md',
        size: MAX_MARKDOWN_CHARACTERS * 3 + 4,
      }),
    ).toBe('Markdown 文件过大，正文最多支持 200,000 个字符');
  });

  it('removes a UTF-8 BOM without changing Markdown content', () => {
    expect(prepareMarkdownImport('\uFEFF# 标题\n\n正文')).toBe(
      '# 标题\n\n正文',
    );
    expect(prepareMarkdownImport('# 标题\n\n正文')).toBe('# 标题\n\n正文');
  });

  it('rejects Markdown content beyond the article contract limit', () => {
    expect(() =>
      prepareMarkdownImport('a'.repeat(MAX_MARKDOWN_CHARACTERS + 1)),
    ).toThrow('Markdown 正文不能超过 200,000 个字符');
  });

  it('uses the file name without its Markdown extension as the title', () => {
    expect(articleTitleFromFileName('发布说明.md')).toBe('发布说明');
    expect(articleTitleFromFileName('my-imported_article.MD')).toBe(
      'my-imported_article',
    );
  });

  it('keeps file-name titles within the article contract limit', () => {
    const title = articleTitleFromFileName(`${'标'.repeat(130)}.md`);

    expect(title).toHaveLength(120);
    expect(title.endsWith('...')).toBe(true);
  });

  it('reads the content and ignores headings and paragraphs for metadata', async () => {
    const file = {
      name: 'release-notes.md',
      size: 48,
      text: async () => '\uFEFF# 正文标题\n\n这段正文不再填充摘要。',
    } as File;

    await expect(readMarkdownImportFile(file)).resolves.toEqual({
      contentMarkdown: '# 正文标题\n\n这段正文不再填充摘要。',
      title: 'release-notes',
    });
  });
});
