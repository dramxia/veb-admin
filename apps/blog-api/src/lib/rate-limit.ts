import { RateLimitError } from './errors';

type Bucket = { tokens: number; updatedAt: number };

export type RateLimitOptions = {
  key: string;
  capacity: number;
  windowMs: number;
  now?: number;
};

const buckets = new Map<string, Bucket>();

export function takeRateLimitToken({
  key,
  capacity,
  windowMs,
  now = Date.now(),
}: RateLimitOptions) {
  const current = buckets.get(key) ?? { tokens: capacity, updatedAt: now };
  const elapsed = Math.max(0, now - current.updatedAt);
  const tokens = Math.min(
    capacity,
    current.tokens + (elapsed / windowMs) * capacity,
  );
  if (tokens < 1) {
    buckets.set(key, { tokens, updatedAt: now });
    return false;
  }
  buckets.set(key, { tokens: tokens - 1, updatedAt: now });
  return true;
}

export function assertRateLimit(options: RateLimitOptions) {
  if (!takeRateLimitToken(options)) throw new RateLimitError();
}

export function getClientIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

export function resetRateLimit() {
  buckets.clear();
}
