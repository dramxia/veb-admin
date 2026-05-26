import { RateLimitError } from './errors';

type Bucket = {
  tokens: number;
  updatedAt: number;
};

export type RateLimitOptions = {
  key: string;
  capacity: number;
  windowMs: number;
  now?: number;
};

const buckets = new Map<string, Bucket>();

function refill(
  bucket: Bucket,
  capacity: number,
  windowMs: number,
  now: number,
) {
  const elapsed = Math.max(0, now - bucket.updatedAt);
  const refillTokens = (elapsed / windowMs) * capacity;
  return {
    tokens: Math.min(capacity, bucket.tokens + refillTokens),
    updatedAt: now,
  };
}

export function takeRateLimitToken({
  key,
  capacity,
  windowMs,
  now = Date.now(),
}: RateLimitOptions) {
  const current = buckets.get(key) ?? { tokens: capacity, updatedAt: now };
  const next = refill(current, capacity, windowMs, now);

  if (next.tokens < 1) {
    buckets.set(key, next);
    return false;
  }

  buckets.set(key, { tokens: next.tokens - 1, updatedAt: now });
  return true;
}

export function assertRateLimit(options: RateLimitOptions) {
  if (!takeRateLimitToken(options)) {
    throw new RateLimitError();
  }
}

export function getClientIp(req?: Request | { headers: Headers }) {
  if (!req) return 'unknown';
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

export function resetRateLimit() {
  buckets.clear();
}
