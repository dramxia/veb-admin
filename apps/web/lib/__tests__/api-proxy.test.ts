import { describe, expect, it, vi } from 'vitest';
import { proxyApiRequest, resolveApiUpstream } from '@/lib/api-proxy';

const env = { CORE_API_INTERNAL_URL: 'http://core-api:1067' };

describe('runtime API proxy', () => {
  it('uses one Core API upstream for public and private paths', () => {
    expect(resolveApiUpstream(env).origin).toBe('http://core-api:1067');
  });

  it('preserves path, query, cookies, request id and upstream cookies', async () => {
    const upstreamFetch = vi.fn<typeof fetch>(async (input, init) => {
      const headers = new Headers(init?.headers);
      expect(String(input)).toBe(
        'http://core-api:1067/api/v1/blog/articles?tag=typescript',
      );
      expect(headers.get('cookie')).toBe('blog_visitor=visitor-1');
      expect(headers.get('x-request-id')).toBe('request-1');
      expect(headers.get('host')).toBeNull();
      expect(headers.get('x-forwarded-host')).toBe('veb.example.com');
      expect(headers.get('x-forwarded-for')).toBeNull();
      return Response.json(
        { code: 0, data: { items: [] }, message: 'ok' },
        {
          headers: {
            'set-cookie': 'blog_visitor=visitor-2; Path=/; HttpOnly',
            'x-request-id': 'request-1',
          },
        },
      );
    });
    const response = await proxyApiRequest(
      new Request(
        'https://veb.example.com/api/v1/blog/articles?tag=typescript',
        {
          headers: {
            cookie: 'blog_visitor=visitor-1',
            host: 'veb.example.com',
            'x-forwarded-for': '198.51.100.99',
            'x-request-id': 'request-1',
          },
        },
      ),
      { env, fetch: upstreamFetch },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBe('request-1');
    expect(response.headers.get('set-cookie')).toContain(
      'blog_visitor=visitor-2',
    );
  });

  it('trusts proxy IP headers only when explicitly configured', async () => {
    const upstreamFetch = vi.fn<typeof fetch>(async (_input, init) => {
      const headers = new Headers(init?.headers);
      expect(headers.get('x-forwarded-for')).toBe('203.0.113.9');
      expect(headers.get('x-forwarded-proto')).toBe('https');
      return Response.json({ code: 0, data: {}, message: 'ok' });
    });
    await proxyApiRequest(
      new Request('http://web:1066/api/auth/session', {
        headers: {
          'x-forwarded-for': '203.0.113.9',
          'x-forwarded-proto': 'https',
        },
      }),
      {
        env: { ...env, WEB_TRUST_PROXY_HEADERS: 'true' },
        fetch: upstreamFetch,
      },
    );
  });

  it('streams write bodies and returns the standard 503 envelope on failure', async () => {
    const upstreamFetch = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe('http://core-api:1067/api/v1/me');
      await expect(new Response(init?.body).text()).resolves.toBe(
        '{"nickname":"Runtime"}',
      );
      return Response.json({
        code: 0,
        data: { nickname: 'Runtime' },
        message: 'ok',
      });
    });
    const response = await proxyApiRequest(
      new Request('http://localhost:1066/api/v1/me', {
        method: 'PATCH',
        body: '{"nickname":"Runtime"}',
        headers: { 'content-type': 'application/json' },
      }),
      { env, fetch: upstreamFetch },
    );
    expect(response.status).toBe(200);

    const unavailable = await proxyApiRequest(
      new Request('http://localhost/api/v1/system/users', {
        headers: { 'x-request-id': 'request-failed' },
      }),
      {
        env,
        fetch: vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')),
      },
    );
    expect(unavailable.status).toBe(503);
    await expect(unavailable.json()).resolves.toEqual({
      code: 50301,
      data: null,
      message: '上游服务暂时不可用',
    });
  });
});
