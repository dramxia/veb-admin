import { ERROR_CODES } from '@veb/api-contracts';
import { describe, expect, it, vi } from 'vitest';
import {
  fail,
  ok,
  pageOptions,
  readJson,
  readQuery,
  withApi,
} from '../api-kit/api';
import { AppError, ParamError } from '../api-kit/errors';

describe('ok/fail', () => {
  it('wraps data in the api success shell', async () => {
    const response = ok({ id: 1 });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      code: ERROR_CODES.OK,
      data: { id: 1 },
      message: 'ok',
    });
  });

  it('wraps errors in the api error shell with the given status', async () => {
    const response = fail(ERROR_CODES.NOT_FOUND, '不存在', 404);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      code: ERROR_CODES.NOT_FOUND,
      data: null,
      message: '不存在',
    });
  });
});

describe('readJson/readQuery/pageOptions', () => {
  it('parses a json body with the schema', async () => {
    const body = await readJson(
      new Request('http://api.test', {
        method: 'POST',
        body: JSON.stringify({ name: 'vex' }),
      }),
      { parse: (value) => value as { name: string } },
    );
    expect(body).toEqual({ name: 'vex' });
  });

  it('rejects a non-json body with ParamError', async () => {
    await expect(
      readJson(
        new Request('http://api.test', { method: 'POST', body: 'not-json' }),
        { parse: (value) => value },
      ),
    ).rejects.toBeInstanceOf(ParamError);
  });

  it('parses query params and computes pagination offsets', () => {
    const query = readQuery(new Request('http://api.test?page=3&pageSize=25'), {
      parse: (value) => value as { page: string; pageSize: string },
    });
    expect(query).toEqual({ page: '3', pageSize: '25' });
    expect(pageOptions({ page: 3, pageSize: 25 })).toEqual({
      page: 3,
      pageSize: 25,
      skip: 50,
    });
  });
});

describe('withApi', () => {
  it('attaches the incoming request id and logs access', async () => {
    const consoleInfo = vi
      .spyOn(console, 'info')
      .mockImplementation(() => undefined);
    const handler = withApi(
      async (request: Request) => {
        void request;
        return ok({ healthy: true });
      },
      {
        scope: 'test-api',
      },
    );
    const response = await handler(
      new Request('http://api.test/health', {
        headers: { 'x-request-id': 'request-123' },
      }),
    );

    expect(response.headers.get('x-request-id')).toBe('request-123');
    expect(consoleInfo).toHaveBeenCalledWith(
      '[test-api:request]',
      expect.objectContaining({ requestId: 'request-123', status: 200 }),
    );
    consoleInfo.mockRestore();
  });

  it('generates a request id when the incoming one is missing or too long', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const handler = withApi(
      async (request: Request) => {
        void request;
        return ok(null);
      },
      { scope: 'test-api' },
    );

    const missing = await handler(new Request('http://api.test/'));
    expect(missing.headers.get('x-request-id')).toBeTruthy();

    const tooLong = await handler(
      new Request('http://api.test/', {
        headers: { 'x-request-id': 'x'.repeat(129) },
      }),
    );
    const generated = tooLong.headers.get('x-request-id');
    expect(generated).toBeTruthy();
    expect(generated).not.toBe('x'.repeat(129));
    vi.restoreAllMocks();
  });

  it('maps AppError to the matching status and code', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const handler = withApi(
      async (_request: Request) => {
        void _request;
        throw new AppError(ERROR_CODES.CONFLICT, '冲突', 409);
      },
      { scope: 'test-api' },
    );
    const response = await handler(new Request('http://api.test/'));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: ERROR_CODES.CONFLICT,
      data: null,
      message: '冲突',
    });
    vi.restoreAllMocks();
  });

  it('delegates unknown errors to mappers before the 500 fallback', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const handler = withApi(
      async (_request: Request) => {
        void _request;
        throw new Error('boom');
      },
      {
        scope: 'test-api',
        serverErrorMessage: '内部错误',
        errorMappers: [
          (error) =>
            error instanceof Error && error.message === 'boom'
              ? fail(ERROR_CODES.SERVICE_UNAVAILABLE, '上游不可用', 503)
              : undefined,
        ],
      },
    );
    const response = await handler(new Request('http://api.test/'));
    expect(response.status).toBe(503);
    expect(consoleError).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('runs beforeHandle before the handler and onFailure on errors', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const calls: string[] = [];
    const handler = withApi(
      async (_request: Request) => {
        void _request;
        calls.push('handler');
        throw new Error('fail');
      },
      {
        scope: 'test-api',
        beforeHandle: () => {
          calls.push('before');
        },
        onFailure: () => {
          calls.push('onFailure');
        },
        errorMappers: [() => fail(ERROR_CODES.SERVER_ERROR, 'handled', 500)],
      },
    );
    const response = await handler(new Request('http://api.test/'));
    expect(response.status).toBe(500);
    expect(calls).toEqual(['before', 'handler', 'onFailure']);
    vi.restoreAllMocks();
  });
});
