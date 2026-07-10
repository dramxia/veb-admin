import { describe, expect, it } from 'vitest';
import { toIsoDateTime, toLocalDateTimeInput } from '@/lib/date-time';

describe('datetime-local conversion', () => {
  it('在本地时间和带时区 ISO 时间之间可往返', () => {
    const localValue = '2026-07-10T09:30';
    const isoValue = toIsoDateTime(localValue);

    expect(isoValue).toMatch(/Z$/);
    expect(toLocalDateTimeInput(isoValue)).toBe(localValue);
  });

  it('空值和非法值返回空字符串', () => {
    expect(toIsoDateTime('')).toBe('');
    expect(toIsoDateTime('not-a-date')).toBe('');
    expect(toLocalDateTimeInput(null)).toBe('');
    expect(toLocalDateTimeInput('not-a-date')).toBe('');
  });
});
