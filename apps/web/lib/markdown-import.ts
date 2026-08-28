export const MAX_MARKDOWN_CHARACTERS = 200_000;

const MAX_MARKDOWN_FILE_BYTES = MAX_MARKDOWN_CHARACTERS * 3 + 3;
const MAX_ARTICLE_TITLE_CHARACTERS = 120;
const MARKDOWN_FILE_EXTENSION = /\.md$/i;

type MarkdownFileMetadata = {
  name: string;
  size: number;
};

export function articleTitleFromFileName(fileName: string) {
  const title = fileName.trim().replace(MARKDOWN_FILE_EXTENSION, '').trim();
  if (title.length <= MAX_ARTICLE_TITLE_CHARACTERS) return title;
  return `${title.slice(0, MAX_ARTICLE_TITLE_CHARACTERS - 3).trimEnd()}...`;
}

export function getMarkdownImportError(file: MarkdownFileMetadata) {
  if (!MARKDOWN_FILE_EXTENSION.test(file.name)) {
    return '请选择 .md 格式的 Markdown 文件';
  }
  if (file.size > MAX_MARKDOWN_FILE_BYTES) {
    return 'Markdown 文件过大，正文最多支持 200,000 个字符';
  }
  return null;
}

export function prepareMarkdownImport(content: string) {
  const normalized = content.startsWith('\uFEFF') ? content.slice(1) : content;
  if (normalized.length > MAX_MARKDOWN_CHARACTERS) {
    throw new Error('Markdown 正文不能超过 200,000 个字符');
  }
  return normalized;
}

export async function readMarkdownImportFile(file: File) {
  const error = getMarkdownImportError(file);
  if (error) throw new Error(error);

  return {
    contentMarkdown: prepareMarkdownImport(await file.text()),
    title: articleTitleFromFileName(file.name),
  };
}
