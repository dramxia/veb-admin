import { ERROR_CODES } from '@veb/api-contracts';
import { describe, expect, it, vi } from 'vitest';
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

  it('returns an actionable 503 when the blog database is unreachable', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const handler = withApi(async () => {
      throw {
        name: 'PrismaClientUnknownRequestError',
        message: "Can't reach database server",
      };
    });
    const response = await handler(
      new Request('http://blog-api:1068/api/v1/public/articles'),
      { params: {} },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
      data: null,
      message:
        '博客数据库连接失败。请确认 blog-postgres 已启动；本地开发还需启动 Docker Desktop。',
    });
    expect(consoleError).toHaveBeenCalledWith(
      '[blog-api:database-unavailable]',
      expect.objectContaining({ message: "Can't reach database server" }),
    );
    consoleError.mockRestore();
  });
});
