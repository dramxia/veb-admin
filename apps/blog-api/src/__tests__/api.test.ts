import { ERROR_CODES } from '@veb/api-contracts';
import { describe, expect, it } from 'vitest';
import { ok, withApi } from '@/lib/api';

describe('API wrapper', () => {
  it('rejects an internal request without a request id and service token', async () => {
    const handler = withApi(async () => ok({ reached: true }), {
      internal: true,
      permission: 'content:article:view',
    });
    const response = await handler(
      new Request('http://blog-api:1068/api/internal/v1/articles'),
      { params: {} },
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: ERROR_CODES.UNAUTHORIZED,
      data: null,
    });
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });

  it('preserves a caller request id on public responses', async () => {
    const handler = withApi(async () => ok({ healthy: true }));
    const response = await handler(
      new Request('http://blog-api:1068/health/live', {
        headers: { 'x-request-id': 'request-123' },
      }),
      { params: {} },
    );

    expect(response.headers.get('x-request-id')).toBe('request-123');
  });
});
