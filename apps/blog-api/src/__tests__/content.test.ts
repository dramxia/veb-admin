import { describe, expect, it } from 'vitest';
import {
  createContentSlug,
  hashVisitorKey,
  maskVisitorHash,
  normalizeSlug,
  validatePublishableArticle,
} from '@/lib/content';

describe('content helpers', () => {
  it('normalizes readable slugs and generates a fallback slug', () => {
    expect(normalizeSlug('Hello, VEB World!')).toBe('hello-veb-world');
    expect(createContentSlug('中文标题', 'article')).toMatch(
      /^article-[a-f0-9]{10}$/,
    );
  });

  it('requires summary and content before publishing', () => {
    expect(() => validatePublishableArticle({ status: 'DRAFT' })).not.toThrow();
    expect(() =>
      validatePublishableArticle({
        status: 'PUBLISHED',
        summary: '',
        contentMarkdown: '# content',
      }),
    ).toThrow('发布文章前请填写摘要');
    expect(() =>
      validatePublishableArticle({
        status: 'PUBLISHED',
        summary: 'summary',
        contentMarkdown: '',
      }),
    ).toThrow('发布文章前请填写正文');
  });

  it('uses the dedicated blog visitor secret', () => {
    const first = hashVisitorKey('visitor-1', 'blog-secret');
    expect(first).toBe(hashVisitorKey('visitor-1', 'blog-secret'));
    expect(first).not.toContain('visitor-1');
    expect(maskVisitorHash(first)).toMatch(/^[a-f0-9]{8}\.\.\.[a-f0-9]{4}$/);
  });
});
