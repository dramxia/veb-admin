import { beforeEach, describe, expect, it } from 'vitest';
import { resetRateLimit, takeRateLimitToken } from '@/lib/rate-limit';

describe('rate limit', () => {
  beforeEach(resetRateLimit);

  it('blocks requests after the bucket is exhausted', () => {
    expect(
      takeRateLimitToken({ key: 'ip', capacity: 2, windowMs: 5000, now: 0 }),
    ).toBe(true);
    expect(
      takeRateLimitToken({ key: 'ip', capacity: 2, windowMs: 5000, now: 1 }),
    ).toBe(true);
    expect(
      takeRateLimitToken({ key: 'ip', capacity: 2, windowMs: 5000, now: 2 }),
    ).toBe(false);
  });

  it('refills tokens over time', () => {
    takeRateLimitToken({ key: 'ip', capacity: 2, windowMs: 5000, now: 0 });
    takeRateLimitToken({ key: 'ip', capacity: 2, windowMs: 5000, now: 1 });
    expect(
      takeRateLimitToken({ key: 'ip', capacity: 2, windowMs: 5000, now: 2501 }),
    ).toBe(true);
  });
});
