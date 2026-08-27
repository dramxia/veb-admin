import { describe, expect, it } from 'vitest';
import { getClientIp, getClientIpHeader } from '../api-kit/rate-limit';

function req(headers: Record<string, string>) {
  return { headers: new Headers(headers) };
}

describe('getClientIpHeader', () => {
  it('prefers x-forwarded-for', () => {
    expect(
      getClientIpHeader(req({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' })),
    ).toBe('1.1.1.1');
  });

  it('falls back to x-real-ip then cf-connecting-ip', () => {
    expect(getClientIpHeader(req({ 'x-real-ip': '3.3.3.3' }))).toBe('3.3.3.3');
    expect(getClientIpHeader(req({ 'cf-connecting-ip': '4.4.4.4' }))).toBe(
      '4.4.4.4',
    );
  });

  it('returns null when no header matches', () => {
    expect(getClientIpHeader(req({}))).toBeNull();
    expect(getClientIpHeader(null)).toBeNull();
  });
});

describe('getClientIp', () => {
  it('returns the same value as getClientIpHeader when present', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '1.1.1.1' }))).toBe('1.1.1.1');
  });

  it("returns 'unknown' when no header matches", () => {
    expect(getClientIp(req({}))).toBe('unknown');
    expect(getClientIp(undefined)).toBe('unknown');
  });
});
