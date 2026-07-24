import { describe, expect, it } from 'vitest';
import { getSafeInternalPath } from '@/lib/safe-redirect';

describe('getSafeInternalPath', () => {
  it('保留合法站内路径、查询参数和锚点', () => {
    expect(getSafeInternalPath('/admin/system/user?tab=enabled#list')).toBe(
      '/admin/system/user?tab=enabled#list',
    );
  });

  it.each([
    null,
    '',
    'https://example.com',
    '//example.com/path',
    '/\\example.com/path',
    'javascript:alert(1)',
  ])('拒绝不安全回跳地址：%s', (value) => {
    expect(getSafeInternalPath(value)).toBe('/');
  });
});
