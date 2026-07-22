import { describe, expect, it } from 'vitest';
import { sanitizeMarkdownUrl } from '@/lib/markdown';

describe('markdown URL safety', () => {
  it('allows normal links and rejects executable URL protocols', () => {
    expect(sanitizeMarkdownUrl('https://example.com/article')).toBe(
      'https://example.com/article',
    );
    expect(sanitizeMarkdownUrl('/articles/example')).toBe('/articles/example');
    expect(sanitizeMarkdownUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeMarkdownUrl('java\nscript:alert(1)')).toBe('');
    expect(
      sanitizeMarkdownUrl('data:text/html,<script>alert(1)</script>'),
    ).toBe('');
  });
});
