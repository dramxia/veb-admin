import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const iconRoot = fileURLToPath(new URL('../../assets/icons', import.meta.url));
const webRoot = resolve(iconRoot, '../..');
const categories = new Set([
  'actions',
  'auth',
  'brand',
  'content',
  'editor',
  'navigation',
  'status',
  'system',
]);

function collectFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });
}

const svgFiles = collectFiles(iconRoot).filter(
  (path) => extname(path) === '.svg',
);
const sourceFiles = [join(webRoot, 'app'), join(webRoot, 'components')].flatMap(
  collectFiles,
);

describe('local icon set', () => {
  it('keeps every SVG inside a supported category', () => {
    expect(svgFiles.length).toBeGreaterThan(0);
    for (const path of svgFiles) {
      const [category, fileName, ...rest] = relative(iconRoot, path).split('/');
      expect(categories.has(category), path).toBe(true);
      expect(fileName.endsWith('.svg'), path).toBe(true);
      expect(rest, path).toHaveLength(0);
    }
  });

  it('uses the shared canvas, stroke and variable color contract', () => {
    for (const path of svgFiles) {
      const source = readFileSync(path, 'utf8');
      expect(source, path).toContain('viewBox="0 0 24 24"');
      expect(source, path).toContain('fill="none"');
      expect(source, path).toContain('stroke="currentColor"');
      expect(source, path).toContain('stroke-width="1.8"');
      expect(source, path).toContain('stroke-linecap="round"');
      expect(source, path).toContain('stroke-linejoin="round"');
      expect(source, path).not.toMatch(/stroke="(?!currentColor|none)[^"]+"/);
      expect(source, path).not.toMatch(/fill="(?!none|currentColor)[^"]+"/);
    }
  });

  it('keeps application icons on the local rendering path', () => {
    for (const path of sourceFiles) {
      if (!/\.[jt]sx?$/.test(path)) continue;
      const source = readFileSync(path, 'utf8');
      expect(source, path).not.toContain('lucide-react');
      expect(source, path).not.toContain('<svg');
      expect(source, path).not.toMatch(/<LocalIcon\b[^>]*\bboxSize\s*=/);
      expect(source, path).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
